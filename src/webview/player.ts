import { Disposable } from "../dispose";
import { ExtMessage, ExtMessageType, postMessage, WebviewMessageType } from "../message";
import { EventType, Event } from "./events";

export default class Player extends Disposable {
    ac: AudioContext;
    ab: AudioBuffer;
    postMessage: postMessage;

    // show decode state 
    decodeState: HTMLElement;

    // play audio
    playButton: HTMLButtonElement;
    isPlaying: boolean = false;
    lastStartAcTime: number = 0;
    currentSec: number = 0;
    source: AudioBufferSourceNode;

    // volumebar
    gainNode: GainNode;
    volumeBar: HTMLInputElement;

    // seekbar
    seekbarValue: number = 0;
    animationFrameID: number = 0;

    constructor (parentID: string, audioContext: AudioContext, audioBuffer: AudioBuffer, postMessage: postMessage) {
        super();
        this.ac = audioContext;
        this.ab = audioBuffer;
        this.postMessage = postMessage;

        // init base html
        const parent = document.getElementById(parentID);
        parent.innerHTML = `
            <div id="decode-state"></div>
            <button id="listen-button">play</button>

            <div>volume</div>
            <input type="range" id="volume-bar" value="100">
                        
            <div>seekbar</div>
            <div class="seek-bar-box">
                <input type="range" id="seek-bar" value="0" />
                <input type="range" id="user-input-seek-bar" class="input-seek-bar" value="0" />
            </div>
        `;

        // register seekbar event
        this._register(new Event(window, EventType.InputSeekbar, (e: CustomEventInit) => {
            this.onSeekbarInput(e.detail.value);
        }));
        // init main seekbar event
        const userinputSeekbar = <HTMLInputElement>document.getElementById("user-input-seek-bar");
        this._register(new Event(userinputSeekbar, EventType.Change, () => {
            this.onSeekbarInput(Number(userinputSeekbar.value));
            userinputSeekbar.value = "100";
        }));
        const visibleSeekbar = <HTMLInputElement>document.getElementById("seek-bar");
        this._register(new Event(window, EventType.UpdateSeekbar, (e: CustomEventInit) => {
            visibleSeekbar.value = e.detail.value;
        }));

        // init volumebar
        this.gainNode = this.ac.createGain();
        this.gainNode.connect(this.ac.destination);
        this.volumeBar = <HTMLInputElement>document.getElementById("volume-bar");
        this._register(new Event(this.volumeBar, EventType.Change, () => this.onVolumeChange()));

        // init play button
        this.playButton = <HTMLButtonElement>document.getElementById("listen-button");
        this._register(new Event(this.playButton, EventType.Click, () => {
            if (this.isPlaying) this.stop();
            else this.play();
        }));
        this.playButton.textContent = "play";
        this.playButton.style.display = "block";

        // init decode state
        this.decodeState = document.getElementById("decode-state");
        this.updateDecdeState("");
        // add eventlistener to get audio data
        this._register(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveData(e.data)));

        // register keyboard shortcuts
        // don't use command.register at audioPreviewEditorProvider.openCustomDocument due to command confliction
        this._register(new Event(window, EventType.KeyDown, (e: KeyboardEvent) => {
            if (e.isComposing || e.code !== "Space") {
                return;
            }
            e.preventDefault();
            this.playButton.click();
        }));
    }

    onReceiveData(msg: ExtMessage) {
        if (msg.type !== ExtMessageType.Data) return;

        if (msg.data.autoPlay) {
            this.playButton.click();
        }

        // copy passed data.samples into audioBuffer manually, because it is once stringified, 
        // and its children are not recognised as Float32Array
        for (let ch = 0; ch < msg.data.numberOfChannels; ch++) {
            const f32a = new Float32Array(msg.data.length);
            for (let i = 0; i < f32a.length; i++) {
                f32a[i] = msg.data.samples[ch][i];
            }
            this.ab.copyToChannel(f32a, ch, msg.data.start);
        }

        // update progress
        const progress = Math.min(Math.floor(msg.data.end * 100 / msg.data.wholeLength), 100);
        this.updateDecdeState("decode: " + progress + "% done");

        if (msg.data.end < msg.data.wholeLength) {
            this.postMessage({
                type: WebviewMessageType.Data, data: { start: msg.data.end, end: msg.data.end + 100000 }
            });
        }
    }

    play() {
        // create audio source node (you cannot call start more than once)
        this.source = this.ac.createBufferSource();
        this.source.buffer = this.ab;
        this.source.connect(this.gainNode);

        // play
        this.isPlaying = true;
        this.playButton.textContent = "stop";
        this.lastStartAcTime = this.ac.currentTime;
        this.source.start(this.ac.currentTime, this.currentSec);

        // move seek bar
        this.animationFrameID = requestAnimationFrame(() => this.tick());
    }

    tick() {
        const current = this.currentSec + this.ac.currentTime - this.lastStartAcTime;
        this.seekbarValue = 100 * current / this.ab.duration;

        // update seek bar value
        const updateSeekbarEvent = new CustomEvent(EventType.UpdateSeekbar, {
            detail: {
                value: this.seekbarValue
            }
        });
        window.dispatchEvent(updateSeekbarEvent);

        // stop if finish playing
        if (current > this.ab.duration) {
            this.stop();
            // reset current time
            this.currentSec = 0;
            this.seekbarValue = 0;
            return;
        }

        if (this.isPlaying) {
            this.animationFrameID = requestAnimationFrame(() => this.tick());
        }
    }

    stop() {
        cancelAnimationFrame(this.animationFrameID);
        this.source.stop();
        this.currentSec += this.ac.currentTime - this.lastStartAcTime;
        this.isPlaying = false;
        this.playButton.textContent = "play";
        this.source = undefined;
    }

    onSeekbarInput(value: number) {
        if (this.isPlaying) {
            this.stop();
        }
        // restart from selected place
        this.currentSec = value * this.ab.duration / 100;
        this.seekbarValue = value;
        this.play();
    }

    onVolumeChange() {
        this.gainNode.gain.value = Number(this.volumeBar.value) / 100;
    }

    updateDecdeState(v: string) {
        this.decodeState.textContent = v;
    }

    public dispose() {
        if (this.isPlaying) this.stop();
        super.dispose();
    }
}

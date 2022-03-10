import { Disposable } from "../dispose";
import { ExtMessage, ExtMessageType, postMessage, WebviewMessageType } from "../message";
import { EventType, Event } from "./events";

export default class Player extends Disposable {
    private _audioContext: AudioContext;
    private _audioBuffer: AudioBuffer;
    private _postMessage: postMessage;

    // play audio
    private _playButton: HTMLButtonElement;
    private _isPlaying: boolean = false;
    private _lastStartAcTime: number = 0;
    private _currentSec: number = 0;
    private _source: AudioBufferSourceNode;

    public get isPlaying() { return this._isPlaying; }
    public get currentSec() { return this._currentSec; }

    // volumebar
    private _gainNode: GainNode;
    private _volumeBar: HTMLInputElement;

    public get volume() { 
        if (!this._gainNode) return 1;
        return this._gainNode.gain.value;
    }

    // seekbar
    private _seekbarValue: number = 0;
    private _animationFrameID: number = 0;

    constructor (parentID: string, audioContext: AudioContext, audioBuffer: AudioBuffer, postMessage: postMessage) {
        super();
        this._audioContext = audioContext;
        this._audioBuffer = audioBuffer;
        this._postMessage = postMessage;

        // init base html
        const parent = document.getElementById(parentID);
        parent.innerHTML = `
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
        this._gainNode = this._audioContext.createGain();
        this._gainNode.connect(this._audioContext.destination);
        this._volumeBar = <HTMLInputElement>document.getElementById("volume-bar");
        this._register(new Event(this._volumeBar, EventType.Change, () => this.onVolumeChange()));

        // init play button
        this._playButton = <HTMLButtonElement>document.getElementById("listen-button");
        this._register(new Event(this._playButton, EventType.Click, () => {
            if (this._isPlaying) this.stop();
            else this.play();
        }));
        this._playButton.textContent = "play";
        this._playButton.style.display = "block";

        // add eventlistener to get audio data
        this._register(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveData(e.data)));

        // register keyboard shortcuts
        // don't use command.register at audioPreviewEditorProvider.openCustomDocument due to command confliction
        this._register(new Event(window, EventType.KeyDown, (e: KeyboardEvent) => {
            if (e.isComposing || e.code !== "Space") {
                return;
            }
            e.preventDefault();
            this._playButton.click();
        }));
    }

    private onReceiveData(msg: ExtMessage) {
        if (msg.type !== ExtMessageType.Data) return;

        if (msg.data.autoPlay) {
            this._playButton.click();
        }

        // copy passed data.samples into audioBuffer manually, because it is once stringified, 
        // and its children are not recognised as Float32Array
        for (let ch = 0; ch < msg.data.numberOfChannels; ch++) {
            const f32a = new Float32Array(msg.data.length);
            for (let i = 0; i < f32a.length; i++) {
                f32a[i] = msg.data.samples[ch][i];
            }
            this._audioBuffer.copyToChannel(f32a, ch, msg.data.start);
        }

        if (msg.data.end < msg.data.wholeLength) {
            this._postMessage({
                type: WebviewMessageType.Data, data: { start: msg.data.end, end: msg.data.end + 100000 }
            });
        }
    }

    private play() {
        // create audio source node (you cannot call start more than once)
        this._source = this._audioContext.createBufferSource();
        this._source.buffer = this._audioBuffer;
        this._source.connect(this._gainNode);

        // play
        this._isPlaying = true;
        this._playButton.textContent = "stop";
        this._lastStartAcTime = this._audioContext.currentTime;
        this._source.start(this._audioContext.currentTime, this._currentSec);

        // move seek bar
        this._animationFrameID = requestAnimationFrame(() => this.tick());
    }

    private tick() {
        const current = this._currentSec + this._audioContext.currentTime - this._lastStartAcTime;
        this._seekbarValue = 100 * current / this._audioBuffer.duration;

        // update seek bar value
        const updateSeekbarEvent = new CustomEvent(EventType.UpdateSeekbar, {
            detail: {
                value: this._seekbarValue
            }
        });
        window.dispatchEvent(updateSeekbarEvent);

        // stop if finish playing
        if (current > this._audioBuffer.duration) {
            this.stop();
            // reset current time
            this._currentSec = 0;
            this._seekbarValue = 0;
            return;
        }

        if (this._isPlaying) {
            this._animationFrameID = requestAnimationFrame(() => this.tick());
        }
    }

    private stop() {
        cancelAnimationFrame(this._animationFrameID);
        this._source.stop();
        this._currentSec += this._audioContext.currentTime - this._lastStartAcTime;
        this._isPlaying = false;
        this._playButton.textContent = "play";
        this._source = undefined;
    }

    private onSeekbarInput(value: number) {
        if (this._isPlaying) {
            this.stop();
        }
        // restart from selected place
        this._currentSec = value * this._audioBuffer.duration / 100;
        this._seekbarValue = value;
        this.play();
    }

    private onVolumeChange() {
        this._gainNode.gain.value = Number(this._volumeBar.value) / 100;
    }

    public dispose() {
        if (this._isPlaying) this.stop();
        super.dispose();
    }
}

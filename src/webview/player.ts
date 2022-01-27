export default class Player {
    lastStartSec: number;
    currentSec: number;
    isPlaying: boolean;
    duration: number;
    ac: AudioContext;
    ab: AudioBuffer;
    source: AudioBufferSourceNode;
    animationFrameID: number;
    gainNode: GainNode;
    volumeBar: HTMLInputElement;
    button: HTMLButtonElement;
    seekbarValue: number;
    userInputSeekBars: Map<string, HTMLElement>;
    seekbarUpdateCallbacks: Map<string, Function>

    constructor(audioContext: AudioContext, audioBuffer: AudioBuffer, duration: number) {
        this.lastStartSec = 0;
        this.currentSec = 0;
        this.isPlaying = false;
        this.duration = duration;
        this.ac = audioContext;
        this.ab = audioBuffer;
        this.animationFrameID = 0;

        this.gainNode = this.ac.createGain();
        this.gainNode.connect(this.ac.destination);

        this.volumeBar = <HTMLInputElement>document.getElementById("volume-bar");
        this.volumeBar.value = "100";
        this.volumeBar.onchange = () => { this.onVolumeChange(); };

        this.button = <HTMLButtonElement>document.getElementById("listen-button");
        this.button.onclick = () => {
            if (this.isPlaying) this.stop();
            else this.play();
        };

        this.seekbarValue = 0;
        this.userInputSeekBars = new Map();
        this.seekbarUpdateCallbacks = new Map();

        //enable play button
        this.button.textContent = "play";
        this.button.style.display = "block";
    }

    play() {
        // create audio source node (you cannot call start more than once)
        this.source = this.ac.createBufferSource();
        this.source.buffer = this.ab;
        this.source.connect(this.gainNode);

        // play
        this.isPlaying = true;
        this.button.textContent = "stop";
        this.lastStartSec = this.ac.currentTime;
        this.source.start(this.ac.currentTime, this.currentSec);

        // move seek bar
        this.animationFrameID = requestAnimationFrame(() => this.tick());
    }

    tick() {
        const current = this.currentSec + this.ac.currentTime - this.lastStartSec;

        // update seek bar value
        let stop = false;
        this.seekbarValue = 100 * current / this.duration;
        this.seekbarUpdateCallbacks.forEach((cb) => {
            const s = cb(this.seekbarValue);
            if (s) stop = true;
        });

        // stop if finish playing
        if (current > this.duration || stop) {
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
        this.currentSec += this.ac.currentTime - this.lastStartSec;
        this.isPlaying = false;
        this.button.textContent = "play";
        this.source = undefined;
    }

    onChange(e) {
        if (this.isPlaying) {
            this.stop();
        }
        // restart from selected place
        this.currentSec = e.target.value * this.duration / 100;
        this.seekbarValue = e.target.value;
        this.play();
        // reset userinput seekbar value to allow user to seek same pos repeatedly
        e.target.value = 100;
    }

    registerSeekbar(name, inputbar, updateCallback, valueConvertFunc) {
        if (!valueConvertFunc) valueConvertFunc = (e) => e;
        inputbar.onchange = (e) => { this.onChange(valueConvertFunc(e)); };
        this.userInputSeekBars.set(name, inputbar);
        this.seekbarUpdateCallbacks.set(name, updateCallback);
    }

    removeSeekbar(name) {
        if (!this.userInputSeekBars.has(name)) return;
        const bar = this.userInputSeekBars.get(name);
        bar.removeEventListener("change", bar.onchange);
        this.userInputSeekBars.delete(name);
        this.seekbarUpdateCallbacks.delete(name);
    }

    onVolumeChange() {
        this.gainNode.gain.value = Number(this.volumeBar.value) / 100;
    }

    dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        this.button.removeEventListener("click", this.button.onclick);
        this.volumeBar.removeEventListener("change", this.volumeBar.onchange);
        this.button.style.display = "none"
        this.volumeBar.style.display = "none";
        this.button = undefined;
        this.volumeBar = undefined;
        this.userInputSeekBars.forEach((bar) => {
            bar.removeEventListener("change", bar.onchange);
        });
    }
}

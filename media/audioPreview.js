class Player {
    constructor(audioContext, audioBuffer, duration) {
        this.lastStartSec = 0;
        this.currentSec = 0;
        this.isPlaying = false;
        this.timer = undefined;
        this.duration = duration;
        this.ac = audioContext;
        this.ab = audioBuffer;

        this.button = document.getElementById("listen-button");
        this.button.onclick = () => { 
            if (this.isPlaying) this.stop();
            else this.play(); 
        };

        this.seekBar = document.getElementById("seek-bar");
        this.seekBar.style.display = "block";
        this.seekBar.value = 0;
        this.seekBar.onchange = () => { this.onChange(); };

        //enable play button
        this.button.textContent = "Play";
        this.button.disabled = false;
    }

    play() {
        // create audio source node (you cannot call start more than once)
        this.source = this.ac.createBufferSource();
        this.source.buffer = this.ab;
        this.source.connect(this.ac.destination);

        // play
        this.isPlaying = true;
        this.button.textContent = "stop";
        this.lastStartSec = this.ac.currentTime;
        this.source.start(this.ac.currentTime, this.currentSec);

        // move seek bar
        this.timer = setInterval(() => {
            const current = this.currentSec + this.ac.currentTime - this.lastStartSec;

            // stop if finish playing
            if (current > this.duration) {
                this.stop();
                // reset current time
                this.currentSec = 0;
                this.seekBar.value = 0;
                return;
            }

            // update seek bar value
            this.seekBar.value = 100 * current / this.duration;
        }, 500);
    }

    stop() {
        this.source.stop();
        clearInterval(this.timer);
        this.timer = undefined;
        this.currentSec += this.ac.currentTime - this.lastStartSec;
        this.isPlaying = false;
        this.button.textContent = "play";
        this.source = undefined;
    }

    onChange() {
        console.log(this.seekBar.value);
        // stop if plaing
        if (this.isPlaying) {
            this.stop();
        }
        // restart from selected place
        this.currentSec = this.seekBar.value * this.duration / 100;
        this.play();
    }
}

(function () {
    const vscode = acquireVsCodeApi();

    const infoTable = document.getElementById("info-table");
    const message = document.getElementById("message");

    // Handle messages from the extension
    window.addEventListener('message', async e => {
        const { audioBuffer } = e.data;
        if (!audioBuffer) {
            message.textContent = "failed to decode: undefined";
            return;
        }

        //insert datas to info table
        infoTable.innerHTML +=
            `<tr><td>sampleRate</td><td>${audioBuffer.sampleRate}</td></tr>\n` +
            `<tr><td>numberOfChannels</td><td>${audioBuffer.numberOfChannels}</td></tr>\n` +
            `<tr><td>length</td><td>${audioBuffer.length}</td></tr>\n` +
            `<tr><td>duration</td><td>${audioBuffer.duration}</td></tr>\n`;

        try {
            // create audio buffer because
            // passed audioBuffer is once stringified(?), 
            // and it isn't recognised as an AudioBuffer when you set it by `source.buffer = audioBuffer`
            const ac = new AudioContext({ sampleRate: audioBuffer.sampleRate });
            const ab = ac.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
            for (let ch = 0; ch < ab.numberOfChannels; ch++) {
                const f32a = new Float32Array(ab.length);
                for (let i = 0; i < ab.length; i++) {
                    f32a[i] = audioBuffer._channelData[ch][i];
                }
                ab.copyToChannel(f32a, ch);
            }

            // set player ui
            new Player(ac, ab, audioBuffer.duration);
        } catch (err) {
            message.textContent = "failed to prepare audioBufferSourceNode: " + err;
            return;
        }
    });

    // Signal to VS Code that the webview is initialized.
    vscode.postMessage({ type: 'ready' });
}());
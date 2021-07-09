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
    let audioBuffer;

    // Handle messages from the extension
    window.addEventListener('message', async e => {
        const { type, data, isTrusted } = e.data;

        switch (type) {
            case "info":
                await showInfo(data);
                // do not play audio in untrusted workspace 
                if (isTrusted === false) {
                    const message = document.getElementById("message");
                    message.textContent = "Cannot play audio in untrusted workspaces";
                    break;
                }
                vscode.postMessage({ type: 'prepare' });
                break;

            case "prepare":
                await showPlayer(data);
                vscode.postMessage({ type: 'play', start: 0, end: 10000 });
                break;

            case "data":
                await setData(data);
                if (audioBuffer.length <= data.end) break;
                vscode.postMessage({ type: 'play', start: data.end, end: data.end + 10000 });
                break;
        }
    });

    async function showInfo(data) {
        const message = document.getElementById("message");
        if (!data) {
            message.textContent = "failed to decode header: undefined";
            return;
        }

        const compressFormat = {
            0: "unknown", 1: "uncompressed PCM", 2: "Microsoft ADPCM",
            3: "IEEE Float", 6: "a-law", 7: "mu-law",
            17: "IMA ADPCM", 20: "ITU G.723 ADPCM (Yamaha)", 49: "GSM 6.10",
            64: "ITU G.721 ADPCM", 80: "MPEG",
            65535: "Experimental"
        };

        const channels = {
            1: "mono", 2: "stereo"
        };

        //insert datas to info table
        const infoTable = document.getElementById("info-table");
        infoTable.innerHTML = `
        <table>
            <tr><th>Key</th><th>Value</th></tr>
            <tr><td>format</td><td>${data.fmt.audioFormat} (${compressFormat[data.fmt.audioFormat]})</td></tr>
            <tr><td>number of channel</td><td>${data.fmt.numChannels} (${channels[data.fmt.numChannels]})</td></tr>
            <tr><td>sampleRate</td><td>${data.fmt.sampleRate}</td></tr>
            <tr><td>byteRate</td><td>${data.fmt.byteRate}</td></tr>
            <tr><td>blockAlign</td><td>${data.fmt.blockAlign}</td></tr>
            <tr><td>bitsPerSample (bit depth)</td><td>${data.fmt.bitsPerSample}</td></tr>
        </table>
        `;
    }

    async function showPlayer(data) {
        const message = document.getElementById("message");
        if (!data) {
            message.textContent = "failed to decode data: undefined";
            return;
        }

        try {
            const ac = new AudioContext({ sampleRate: data.sampleRate });
            audioBuffer = ac.createBuffer(data.numberOfChannels, data.length, data.sampleRate);
            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const f32a = new Float32Array(audioBuffer.length);
                audioBuffer.copyToChannel(f32a, ch);
            }

            // set player ui
            new Player(ac, audioBuffer, data.duration);
        } catch (err) {
            message.textContent = "failed to prepare audioBufferSourceNode: " + err;
            return;
        }
    }

    async function setData(data) {
        // copy passed data.samples into audioBuffer manually, because it is once stringified(?), 
        // and its children are not recognised as Float32Array
        for (let ch = 0; ch < data.numberOfChannels; ch++) {
            const f32a = new Float32Array(data.length);
            for (let i = 0; i < f32a.length; i++) {
                f32a[i] = data.samples[ch][i];
            }
            audioBuffer.copyToChannel(f32a, ch, data.start);
        }

        // show progress
        const decodeState = document.getElementById("decode-state");
        const progress = Math.floor(data.end * 100 / audioBuffer.length);
        decodeState.textContent = "decode: " + progress + "% done";
    }

    // Signal to VS Code that the webview is initialized.
    vscode.postMessage({ type: 'ready' });
}());
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
        this.button.textContent = "play";
        this.button.style.display = "block";
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
        if (this.isPlaying) {
            this.stop();
        }
        // restart from selected place
        this.currentSec = this.seekBar.value * this.duration / 100;
        this.play();
    }

    dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        this.button.removeEventListener("click", this.button.onclick);
        this.seekBar.removeEventListener("change", this.seekBar.onchange);
        this.button.style.display = "none"
        this.seekBar.style.display = "none";
        this.button = undefined;
        this.seekBar = undefined;
    }
}

function insertTableData(table, values) {
    const tr = document.createElement("tr");
    for (const v of values) {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
    }
    table.appendChild(tr);
}

(function () {
    const vscode = acquireVsCodeApi();
    let audioBuffer, player;
    const message = document.getElementById("message");
    const decodeState = document.getElementById("decode-state");

    // Handle messages from the extension
    window.addEventListener('message', async e => {
        const { type, data, isTrusted } = e.data;

        switch (type) {
            case "info":
                if (!data) {
                    message.textContent = "failed to decode header";
                    break;
                }
                await showInfo(data);
                // do not play audio in untrusted workspace 
                if (isTrusted === false) {
                    message.textContent = "Cannot play audio in untrusted workspaces";
                    break;
                }
                vscode.postMessage({ type: 'prepare' });
                break;

            case "prepare":
                if (!data) {
                    message.textContent = "failed to decode data";
                    break;
                }
                await showPlayer(data);
                vscode.postMessage({ type: 'play', start: 0, end: 10000 });
                break;

            case "data":
                if (!data) {
                    message.textContent = "failed to decode data: invalid";
                    break;
                }
                await setData(data);
                if (audioBuffer.length <= data.end) break;
                vscode.postMessage({ type: 'play', start: data.end, end: data.end + 10000 });
                break;

            case "reload":
                await reload();
                vscode.postMessage({ type: 'ready' });
                break;

        }
    });

    async function showInfo(data) {
        const compressFormat = {
            0: "unknown", 1: "uncompressed PCM", 2: "Microsoft ADPCM",
            3: "IEEE Float", 6: "a-law", 7: "mu-law",
            17: "IMA ADPCM", 20: "ITU G.723 ADPCM (Yamaha)", 49: "GSM 6.10",
            64: "ITU G.721 ADPCM", 80: "MPEG",
            65535: "Experimental"
        }[data.fmt.audioFormat] || "unsupported";

        const channels = {
            1: "mono", 2: "stereo"
        }[data.fmt.numChannels] || "unsupported";

        const info = [
            { name: "format", value: `${data.fmt.audioFormat} (${compressFormat})` },
            { name: "number of channel", value: `${data.fmt.numChannels} (${channels})` },
            { name: "sampleRate", value: `${data.fmt.sampleRate}` },
            { name: "byteRate", value: `${data.fmt.byteRate}` },
            { name: "blockAlign", value: `${data.fmt.blockAlign}` },
            { name: "bitsPerSample (bit depth)", value: `${data.fmt.bitsPerSample}` },
            { name: "fileSize", value: `${data.chunkSize + 8} byte` },
        ];

        //insert datas to info table
        const infoTable = document.getElementById("info-table");
        for (const i of info) {
            insertTableData(infoTable, [i.name, i.value]);
        }
    }

    async function showPlayer(data) {
        try {
            const ac = new AudioContext({ sampleRate: data.sampleRate });
            audioBuffer = ac.createBuffer(data.numberOfChannels, data.length, data.sampleRate);
            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const f32a = new Float32Array(audioBuffer.length);
                audioBuffer.copyToChannel(f32a, ch);
            }

            // set player ui
            player = new Player(ac, audioBuffer, data.duration);

            // insert additional data to infoTable
            const infoTable = document.getElementById("info-table");
            insertTableData(infoTable, ["duration", data.duration+"s"]);
        } catch (err) {
            message.textContent = "failed to prepare audioBufferSourceNode: " + err;
            document.getElementById("listen-button").style.display = "none";
            return;
        }
    }

    async function setData(data) {
        // copy passed data.samples into audioBuffer manually, because it is once stringified, 
        // and its children are not recognised as Float32Array
        for (let ch = 0; ch < data.numberOfChannels; ch++) {
            const f32a = new Float32Array(data.length);
            for (let i = 0; i < f32a.length; i++) {
                f32a[i] = data.samples[ch][i];
            }
            audioBuffer.copyToChannel(f32a, ch, data.start);
        }

        // show progress
        const progress = Math.min(Math.floor(data.end * 100 / audioBuffer.length), 100);
        decodeState.textContent = "decode: " + progress + "% done";
    }

    async function reload() {
        message.textContent = "";
        decodeState.textContent = "";
        if (player) {
            player.dispose();
            player = undefined;
        }
    }

    // Signal to VS Code that the webview is initialized.
    vscode.postMessage({ type: 'ready' });
}());
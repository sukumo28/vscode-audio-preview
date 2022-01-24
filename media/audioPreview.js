class Player {
    constructor(audioContext, audioBuffer, duration) {
        this.lastStartSec = 0;
        this.currentSec = 0;
        this.isPlaying = false;
        this.timer = undefined;
        this.duration = duration;
        this.ac = audioContext;
        this.ab = audioBuffer;

        this.gainNode = this.ac.createGain();
        this.gainNode.connect(this.ac.destination);

        this.volumeBar = document.getElementById("volume-bar");
        this.volumeBar.value = 100;
        this.volumeBar.onchange = () => { this.onVolumeChange(); };

        this.button = document.getElementById("listen-button");
        this.button.onclick = () => {
            if (this.isPlaying) this.stop();
            else this.play();
        };

        this.seekbarValue = 0;
        this.userInputSeekBars = [];
        this.seekbarUpdateCallbacks = [];

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
        this.timer = setInterval(() => {
            const current = this.currentSec + this.ac.currentTime - this.lastStartSec;

            // stop if finish playing
            if (current > this.duration) {
                this.stop();
                // reset current time
                this.currentSec = 0;
                this.seekbarValue = 0;
                return;
            }

            // update seek bar value
            this.seekbarValue = 100 * current / this.duration;
            for (const cb of this.seekbarUpdateCallbacks) {
                cb(this.seekbarValue);
            }
        }, 10);
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

    registerSeekbar(inputbar, updateCallback) {
        inputbar.onchange = (e) => {this.onChange(e);};
        this.userInputSeekBars.push(inputbar);
        this.seekbarUpdateCallbacks.push(updateCallback);
    }

    onVolumeChange() {
        this.gainNode.gain.value = this.volumeBar.value / 100;
    }

    dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        this.button.removeEventListener("click", this.button.onclick);
        this.userInputSeekBar.removeEventListener("change", this.userInputSeekBar.onchange);
        this.volumeBar.removeEventListener("change", this.volumeBar.onchange);
        this.button.style.display = "none"
        this.volumeBar.style.display = "none";
        this.button = undefined;
        this.volumeBar = undefined;
        for (const bar of this.userInputSeekBars) {
            bar.removeEventListener("change", bar.onchange);
        }
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

    const analyzeSettingButton = document.getElementById("analyze-setting-button");
    analyzeSettingButton.onclick = () => {
        const settings = document.getElementById("analyze-setting");
        console.log(settings.style.display);
        if (settings.style.display !== "block") {
            settings.style.display = "block";
            analyzeSettingButton.textContent = "▲settings";
        } else {
            settings.style.display = "none";
            analyzeSettingButton.textContent = "▼settings";
        }
    };

    const analyzeButton = document.getElementById("analyze-button");
    analyzeButton.onclick = analyze;
    const analyzeResultBox = document.getElementById("analyze-result-box");
    let spectrogramCanvasList = [];
    let spectrogramCanvasContexts = [];

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
                await prepare(data);
                vscode.postMessage({ type: 'data', start: 0, end: 10000 });
                break;

            case "data":
                if (!data) {
                    message.textContent = "failed to decode data: invalid";
                    break;
                }
                await setData(data);

                if (data.autoPlay && player) {
                    player.button.click();
                }

                if (data.isEnd) {
                    analyzeSettingButton.style.display = "block";
                    analyzeButton.style.display = "block";
                    if (data.autoAnalyze) {
                        analyzeButton.click();
                    }
                    break;
                }
                
                vscode.postMessage({ type: 'data', start: data.end, end: data.end + 10000 });
                break;

            case "reload":
                await reload();
                vscode.postMessage({ type: 'ready' });
                break;

            case "spectrogram":
                if (!data) {
                    message.textContent = "failed to draw spectrogram";
                    break;
                }
                drawSpectrogram(data);
                const endIndex = Math.round(data.settings.maxTime * audioBuffer.sampleRate);
                if (endIndex < data.end) break;
                vscode.postMessage({ type: "spectrogram", channel: data.channel, start: data.end, end: data.end + 10000, settings: data.settings });
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
            { name: "bitsPerSample (bit depth)", value: `${data.fmt.bitsPerSample}` },
            { name: "fileSize", value: `${data.chunkSize + 8} byte` },
        ];

        // clear info table
        const infoTable = document.getElementById("info-table");
        const trList = infoTable.querySelectorAll("tr");
        for (const tr of trList) {
            if (tr.querySelector("th")) continue; // skip header
            infoTable.removeChild(tr);
        }
        // insert datas to info table
        for (const i of info) {
            insertTableData(infoTable, [i.name, i.value]);
        }
    }

    async function prepare(data) {
        try {
            const ac = new AudioContext({ sampleRate: data.sampleRate });
            audioBuffer = ac.createBuffer(data.numberOfChannels, data.length, data.sampleRate);
            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const f32a = new Float32Array(audioBuffer.length);
                audioBuffer.copyToChannel(f32a, ch);
            }

            // set player ui
            player = new Player(ac, audioBuffer, data.duration);
            const userinputSeekbar = document.getElementById("user-input-seek-bar");
            const visibleSeekbar = document.getElementById("seek-bar");
            player.registerSeekbar(userinputSeekbar, (value) => { visibleSeekbar.value = value; });

            // insert additional data to infoTable
            const infoTable = document.getElementById("info-table");
            insertTableData(infoTable, ["duration", data.duration + "s"]);

            // init analyze controller 
            analyzeSettingButton.style.display = "none";
            analyzeButton.style.display = "none";
            clearAnalyzeResult();

        } catch (err) {
            message.textContent = "failed to prepare: " + err;
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

    function clearAnalyzeResult() {
        for (const c of Array.from(analyzeResultBox.children)) {
            analyzeResultBox.removeChild(c);
        }
        spectrogramCanvasList = [];
        spectrogramCanvasContexts = [];
    }

    function analyzeSettings() {
        const windowSizeSelect = document.getElementById("analyze-window-size");
        const windowSize = parseInt(windowSizeSelect.value, 10);
        windowSizeSelect.value = windowSize;

        const minFreqInput = document.getElementById("analyze-min-frequency");
        let minFreq = parseInt(minFreqInput.value, 10);
        if (isNaN(minFreq) || minFreq < 0) minFreq = 0;
        const maxFreqInput = document.getElementById("analyze-max-frequency");
        let maxFreq = parseInt(maxFreqInput.value, 10);
        const maxf = audioBuffer.sampleRate / 2;
        if (isNaN(maxFreq) || maxf < maxFreq) maxFreq = maxf;
        if (maxFreq <= minFreq) {
            minFreq = 0;
            maxFreq = maxf;
        }
        minFreqInput.value = minFreq;
        maxFreqInput.value = maxFreq;

        const minTimeInput = document.getElementById("analyze-min-time");
        let minTime = parseFloat(minTimeInput.value);
        if (isNaN(minTime) || minTime < 0) minTime = 0;
        const maxTimeInput = document.getElementById("analyze-max-time");
        let maxTime = parseFloat(maxTimeInput.value);
        if (isNaN(maxTime) || audioBuffer.duration < maxTime) maxTime = audioBuffer.duration;
        if (maxTime <= minTime) {
            minTime = 0;
            maxTime = audioBuffer.duration;
        }
        minTimeInput.value = minTime;
        maxTimeInput.value = maxTime;

        return {
            windowSize,
            minFrequency: minFreq,
            maxFrequency: maxFreq,
            minTime: minTime,
            maxTime: maxTime,
        };
    }

    function analyze() {
        analyzeButton.style.display = "none";
        clearAnalyzeResult();

        const settings = analyzeSettings();

        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            showWaveForm(ch, settings);
            showSpectrogram(ch, settings);
        }

        // register seekbar on figures
        const visibleBar = document.createElement("div");
        visibleBar.className = "seek-div";
        analyzeResultBox.appendChild(visibleBar);

        const inputSeekbar = document.createElement("input");
        inputSeekbar.type = "range";
        inputSeekbar.className = "input-seek-bar";
        analyzeResultBox.appendChild(inputSeekbar);

        player.registerSeekbar(inputSeekbar, (value) => {
            visibleBar.style.width = `${value}%`;
        });

        analyzeButton.style.display = "block";
    }

    function showWaveForm(ch, settings) {
        const width = 3000;
        const height = 500;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        analyzeResultBox.appendChild(canvas);
        const context = canvas.getContext("2d");
        context.fillStyle = "rgb(0,0,0)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgb(91,252,91)";

        const startIndex = Math.floor(settings.minTime * audioBuffer.sampleRate);
        const endIndex = Math.floor(settings.maxTime * audioBuffer.sampleRate);
        const data = audioBuffer.getChannelData(ch).slice(startIndex, endIndex);
        let maxValue = 0, minValue = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < data.length; i++) {
            if (maxValue < data[i]) maxValue = data[i];
            if (data[i] < minValue) minValue = data[i];
        }
        for (let i = 0; i < data.length; i++) {
            data[i] = (data[i] - minValue) / (maxValue - minValue); // normalize to [0,1]
        }

        // call draw in setTimeout not to block ui
        setTimeout(() => drawWaveForm(data, context, 0, 10000, width, height), 10);
    }

    function drawWaveForm(data, context, start, count, width, height) {
        for (let i = 0; i < count; i++) {
            const x = ((start + i) / data.length) * width;
            const y = height * (1 - data[start + i]);
            context.fillRect(x, y, 1, 1);
        }

        if (start + count < audioBuffer.length) {
            // call draw in setTimeout not to block ui
            setTimeout(() => drawWaveForm(data, context, start + count, count, width, height), 10);
        }
    }

    function showSpectrogram(ch, settings) {
        const canvas = document.createElement("canvas");
        canvas.width = 4500;
        canvas.height = 2000;
        const context = canvas.getContext("2d");
        context.fillStyle = "rgb(0,0,0)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        analyzeResultBox.appendChild(canvas);
        spectrogramCanvasList.push(canvas);
        spectrogramCanvasContexts.push(context);
        const startIndex = Math.floor(settings.minTime * audioBuffer.sampleRate);
        vscode.postMessage({ type: "spectrogram", channel: ch, start: startIndex, end: 10000, settings });
    }

    function drawSpectrogram(data) {
        const ch = data.channel;
        const canvas = spectrogramCanvasList[ch];
        const context = spectrogramCanvasContexts[ch];
        if (!canvas || !context) return;

        const width = canvas.width;
        const height = canvas.height;
        const spectrogram = data.spectrogram;
        const wholeSampleNum = (data.settings.maxTime - data.settings.minTime) * audioBuffer.sampleRate;
        const blockSize = data.end - data.start;
        const blockStart = data.start - Math.floor(data.settings.minTime*audioBuffer.sampleRate);
        const hopSize = data.settings.windowSize / 2;
        const rectWidth = width * (hopSize / blockSize);
        for (let i = 0; i < spectrogram.length; i++) {
            const x = width * ((i * hopSize + blockStart) / wholeSampleNum);
            const rectHeight = (height / spectrogram[i].length);
            for (let j = 0; j < spectrogram[i].length; j++) {
                const y = height * (1 - (j / spectrogram[i].length));

                const value = spectrogram[i][j];
                if (value < 0.001) {
                    continue;
                } else if (value < 0.7) {
                    context.fillStyle = `rgb(0,0,${Math.floor(value * 255)})`;
                } else {
                    context.fillStyle = `rgb(0,${Math.floor(value * 255)},255)`;
                }

                context.fillRect(x, y, rectWidth, rectHeight);
            }
        }
    }

    // Signal to VS Code that the webview is initialized.
    vscode.postMessage({ type: 'ready' });
}());
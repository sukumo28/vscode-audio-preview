import { Disposable } from "../dispose";
import { EventType, Event } from "./events";

interface AnalyzeSettings {
    windowSize: number,
    minFrequency: number,
    maxFrequency: number,
    minTime: number,
    maxTime: number,
    minAmplitude: number,
    maxAmplitude: number,
    analyzeID: number
}

export default class Analyzer extends Disposable {
    audioBuffer: AudioBuffer;
    analyzeSettingButton: HTMLButtonElement;
    analyzeButton: HTMLButtonElement;
    analyzeResultBox: HTMLElement;
    spectrogramCanvasList: HTMLCanvasElement[] = [];
    spectrogramCanvasContexts: CanvasRenderingContext2D[] = [];
    latestAnalyzeID: number = 0;

    constructor (parentID: string, ab: AudioBuffer) {
        super();
        this.audioBuffer = ab;

        // init base html
        const parent = document.getElementById(parentID);
        parent.innerHTML = `
            <div id="analyze-controller-buttons">
                <div>analyze</div>
                <button id="analyze-button" class="seek-bar-box">analyze</button>
                <button id="analyze-setting-button">▼settings</button>
            </div>
            <div id="analyze-setting">
                <div>
                    window size:
                    <select id="analyze-window-size">
                        <option value="256">256</option>
                        <option value="512">512</option>
                        <option value="1024" selected>1024</option>
                        <option value="2048">2048</option>
                        <option value="4096">4096</option>
                        <option value="8192">8192</option>
                    </select>
                </div>
                <div>
                    frequency range:
                    <input id="analyze-min-frequency" type="number" value="0">Hz ~
                    <input id="analyze-max-frequency" type="number" value="24000">Hz
                </div>
                <div>
                    time range:
                    <input id="analyze-min-time" type="number" value="0">s ~
                    <input id="analyze-max-time" type="number" value="1000">s
                </div>
                <div>
                    waveform amplitude range:
                    <input id="analyze-min-amplitude" type="number" value="-1"> ~
                    <input id="analyze-max-amplitude" type="number" value="1">
                </div>
            </div>
        `;

        // init analyze setting button
        this.analyzeSettingButton = <HTMLButtonElement>document.getElementById("analyze-setting-button");
        this.analyzeSettingButton.style.display = "none";
        this.analyzeSettingButton.onclick = () => {
            const settings = document.getElementById("analyze-setting");
            if (settings.style.display !== "block") {
                settings.style.display = "block";
                this.analyzeSettingButton.textContent = "▲settings";
            } else {
                settings.style.display = "none";
                this.analyzeSettingButton.textContent = "▼settings";
            }
        };

        // init analyze button
        this.analyzeButton = <HTMLButtonElement>document.getElementById("analyze-button");
        this.analyzeButton.style.display = "none";
        this.analyzeButton.onclick = () => { this.analyze() };

        // init analyze result box
        this.analyzeResultBox = document.getElementById("analyze-result-box");

        // add eventlistener to get spectrogram data
        this._register(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<any>) => this.onReceiveDate(e)));
    }

    clearAnalyzeResult() {
        for (const c of Array.from(this.analyzeResultBox.children)) {
            this.analyzeResultBox.removeChild(c);
        }
        this.spectrogramCanvasList = [];
        this.spectrogramCanvasContexts = [];
    }

    activate(autoAnalyze: boolean) {
        this.analyzeSettingButton.style.display = "block";
        this.analyzeButton.style.display = "block";
        if (autoAnalyze) {
            this.analyzeButton.click();
        }
    }

    onReceiveDate(e: MessageEvent<any>) {
        const { type, data } = e.data;
        switch (type) {
            case "data":
                if (data.wholeLength <= data.end) {
                    this.activate(data.autoAnalyze);
                }
                break;

            case "spectrogram":
                if (data.settings.analyzeID !== this.latestAnalyzeID) break; // cancel old analyze
                this.drawSpectrogram(data);
                const endIndex = Math.round(data.settings.maxTime * this.audioBuffer.sampleRate);
                if (endIndex < data.end) break;
                const postMessageEvent = new CustomEvent(EventType.PostMessage, {
                    detail: {
                        message: {
                            type: "spectrogram",
                            channel: data.channel,
                            start: data.end,
                            end: data.end + 10000,
                            settings: data.settings
                        }
                    }
                });
                window.dispatchEvent(postMessageEvent);
                break;
        }
    }

    analyzeSettings(): AnalyzeSettings {
        const windowSizeSelect = <HTMLSelectElement>document.getElementById("analyze-window-size");
        const windowSize = parseInt(windowSizeSelect.value, 10);
        windowSizeSelect.value = `${windowSize}`;

        const minFreqInput = <HTMLInputElement>document.getElementById("analyze-min-frequency");
        let minFrequency = parseInt(minFreqInput.value, 10);
        if (isNaN(minFrequency) || minFrequency < 0) minFrequency = 0;

        const maxFreqInput = <HTMLInputElement>document.getElementById("analyze-max-frequency");
        let maxFrequency = parseInt(maxFreqInput.value, 10);
        const maxf = this.audioBuffer.sampleRate / 2;

        if (isNaN(maxFrequency) || maxf < maxFrequency) maxFrequency = maxf;
        if (maxFrequency <= minFrequency) {
            minFrequency = 0;
            maxFrequency = maxf;
        }
        minFreqInput.value = `${minFrequency}`;
        maxFreqInput.value = `${maxFrequency}`;

        const minTimeInput = <HTMLInputElement>document.getElementById("analyze-min-time");
        let minTime = Number(minTimeInput.value);
        if (isNaN(minTime) || minTime < 0) minTime = 0;

        const maxTimeInput = <HTMLInputElement>document.getElementById("analyze-max-time");
        let maxTime = Number(maxTimeInput.value);
        if (isNaN(maxTime) || this.audioBuffer.duration < maxTime) maxTime = this.audioBuffer.duration;

        if (maxTime <= minTime) {
            minTime = 0;
            maxTime = this.audioBuffer.duration;
        }
        minTimeInput.value = `${minTime}`;
        maxTimeInput.value = `${maxTime}`;

        const minAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-min-amplitude");
        let minAmplitude = Number(minAmplitudeInput.value);
        if (isNaN(minAmplitude)) minAmplitude = -1;
        const maxAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-max-amplitude");
        let maxAmplitude = Number(maxAmplitudeInput.value);
        if (isNaN(maxAmplitude)) maxAmplitude = 1;
        if (maxAmplitude <= minAmplitude) {
            minAmplitude = -1;
            maxAmplitude = 1;
        }

        return {
            windowSize,
            minFrequency,
            maxFrequency,
            minTime,
            maxTime,
            minAmplitude,
            maxAmplitude,
            analyzeID: ++this.latestAnalyzeID
        };
    }

    analyze() {
        this.analyzeButton.style.display = "none";
        this.clearAnalyzeResult();

        const settings = this.analyzeSettings();

        for (let ch = 0; ch < this.audioBuffer.numberOfChannels; ch++) {
            this.showWaveForm(ch, settings);
            this.showSpectrogram(ch, settings);
        }

        // register seekbar on figures
        const visibleBar = document.createElement("div");
        visibleBar.className = "seek-div";
        this.analyzeResultBox.appendChild(visibleBar);

        const inputSeekbar = document.createElement("input");
        inputSeekbar.type = "range";
        inputSeekbar.className = "input-seek-bar";
        inputSeekbar.step = "0.00001"
        this.analyzeResultBox.appendChild(inputSeekbar);

        this._register(new Event(window, EventType.UpdateSeekbar, (e: CustomEventInit) => {
            const value = e.detail.value;
            const t = value * this.audioBuffer.duration / 100;
            const v = ((t - settings.minTime) / (settings.maxTime - settings.minTime)) * 100;
            const vv = v < 0 ? 0 : 100 < v ? 100 : v;
            visibleBar.style.width = `${vv}%`;
            return 100 < v;
        }));
        this._register(new Event(inputSeekbar, EventType.OnChange, () => {
            const rv = Number(inputSeekbar.value);
            const nv = ((rv / 100 * (settings.maxTime - settings.minTime) + settings.minTime) / this.audioBuffer.duration) * 100;
            const inputSeekbarEvent = new CustomEvent(EventType.InputSeekbar, {
                detail: {
                    value: nv
                }
            });
            window.dispatchEvent(inputSeekbarEvent);
            inputSeekbar.value = "100";
        }));

        this.analyzeButton.style.display = "block";
    }

    showWaveForm(ch: number, settings: AnalyzeSettings) {
        const width = 1000;
        const height = 200;

        const canvasBox = document.createElement("div");
        canvasBox.className = "canvas-box";

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "rgb(91,252,91)";
        canvasBox.appendChild(canvas);

        const axisCanvas = document.createElement("canvas");
        axisCanvas.className = "axis-canvas";
        axisCanvas.width = width;
        axisCanvas.height = height;
        const axisContext = axisCanvas.getContext("2d");
        axisContext.font = `10px Arial`;
        for (let i = 0; i < 10; i++) {
            axisContext.fillStyle = "white";
            const x = Math.round(i * width / 10);
            const t = i * (settings.maxTime - settings.minTime) / 10 + settings.minTime;
            axisContext.fillText(`${(t).toFixed(1)}`, x, 10);
            const y = Math.round((i + 1) * height / 10);
            const a = (i + 1) * (settings.minAmplitude - settings.maxAmplitude) / 10 + settings.maxAmplitude;
            axisContext.fillText(`${(a).toFixed(1)}`, 4, y);

            axisContext.fillStyle = "rgb(80,80,80)";
            for (let j = 0; j < height; j++) axisContext.fillRect(x, j, 1, 1);
            for (let j = 0; j < width; j++) axisContext.fillRect(j, y, 1, 1);
        }
        canvasBox.appendChild(axisCanvas);

        this.analyzeResultBox.appendChild(canvasBox);

        const startIndex = Math.floor(settings.minTime * this.audioBuffer.sampleRate);
        const endIndex = Math.floor(settings.maxTime * this.audioBuffer.sampleRate);
        const data = this.audioBuffer.getChannelData(ch).slice(startIndex, endIndex);
        // convert data. 
        // this is not a normalization because setting.maxAmplitude and setting.minAmplitude 
        // is not a min and max of data, but a figure's Y axis range.
        // data is converted to setting.maxAmplitude is 1 and setting.minAmplitude is 0 and
        // samples out of range is not displayed. 
        for (let i = 0; i < data.length; i++) {
            data[i] = (data[i] - settings.minAmplitude) / (settings.maxAmplitude - settings.minAmplitude);
        }

        // call draw in requestAnimationFrame not to block ui
        requestAnimationFrame(() => this.drawWaveForm(data, context, 0, 10000, width, height, settings.analyzeID));
    }

    drawWaveForm(data, context, start, count, width, height, analyzeID) {
        for (let i = 0; i < count; i++) {
            const x = Math.round(((start + i) / data.length) * width);
            const y = Math.round(height * (1 - (data[start + i] + 1) / 2));
            context.fillRect(x, y, 1, 1);
        }

        if (start + count < this.audioBuffer.length && analyzeID === this.latestAnalyzeID) {
            // call draw in requestAnimationFrame not to block ui
            requestAnimationFrame(() => this.drawWaveForm(data, context, start + count, count, width, height, analyzeID));
        }
    }

    showSpectrogram(ch: number, settings: AnalyzeSettings) {
        const width = 1800;
        const height = 600;

        const canvasBox = document.createElement("div");
        canvasBox.className = "canvas-box";

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        canvasBox.appendChild(canvas);
        this.spectrogramCanvasList.push(canvas);
        this.spectrogramCanvasContexts.push(context);

        const axisCanvas = document.createElement("canvas");
        axisCanvas.className = "axis-canvas";
        axisCanvas.width = width;
        axisCanvas.height = height;
        const axisContext = axisCanvas.getContext("2d");
        axisContext.font = `18px Arial`;
        for (let i = 0; i < 10; i++) {
            axisContext.fillStyle = "white";
            const x = Math.round(i * width / 10);
            const t = i * (settings.maxTime - settings.minTime) / 10 + settings.minTime;
            axisContext.fillText(`${(t).toFixed(1)}`, x, 18);
            const y = Math.round(i * height / 10);
            const f = (10 - i) * (settings.maxFrequency - settings.minFrequency) / 10 + settings.minFrequency;
            axisContext.fillText(`${(f / 1000).toFixed(1)}k`, 4, y - 4);

            axisContext.fillStyle = "rgb(80,80,80)";
            for (let j = 0; j < height; j++) axisContext.fillRect(x, j, 1, 1);
            for (let j = 0; j < width; j++) axisContext.fillRect(j, y, 1, 1);
        }

        canvasBox.appendChild(axisCanvas);

        this.analyzeResultBox.appendChild(canvasBox);

        const startIndex = Math.round(settings.minTime * this.audioBuffer.sampleRate);
        const endIndex = Math.round(settings.maxTime * this.audioBuffer.sampleRate);
        const end = startIndex + 10000 < endIndex ? startIndex + 10000 : endIndex;

        const postMessageEvent = new CustomEvent(EventType.PostMessage, {
            detail: {
                message: { type: "spectrogram", channel: ch, start: startIndex, end, settings }
            }
        });
        window.dispatchEvent(postMessageEvent);
    }

    drawSpectrogram(data) {
        const ch = data.channel;
        const canvas = this.spectrogramCanvasList[ch];
        const context = this.spectrogramCanvasContexts[ch];
        if (!canvas || !context) return;

        const width = canvas.width;
        const height = canvas.height;
        const spectrogram = data.spectrogram;
        const wholeSampleNum = (data.settings.maxTime - data.settings.minTime) * this.audioBuffer.sampleRate;
        const blockSize = data.end - data.start;
        const blockStart = data.start - data.settings.minTime * this.audioBuffer.sampleRate;
        const hopSize = data.settings.windowSize / 2;
        const rectWidth = width * (hopSize / blockSize);

        for (let i = 0; i < spectrogram.length; i++) {
            const x = width * ((i * hopSize + blockStart) / wholeSampleNum);
            const rectHeight = height / spectrogram[i].length;
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
}
import { Disposable } from "../dispose";
import { EventType, Event } from "./events";
import { AnalyzeDefault, AnalyzeSettings } from "../analyzeSettings";
import { ExtMessage, ExtMessageType, ExtSpectrogramMessage, postMessage, WebviewMessageType } from "../message";

export default class Analyzer extends Disposable {
    audioBuffer: AudioBuffer;
    analyzeSettingButton: HTMLButtonElement;
    analyzeButton: HTMLButtonElement;
    analyzeResultBox: HTMLElement;
    spectrogramCanvasList: HTMLCanvasElement[] = [];
    spectrogramCanvasContexts: CanvasRenderingContext2D[] = [];
    latestAnalyzeID: number = 0;
    defaultSetting: AnalyzeDefault;
    postMessage: postMessage;

    constructor (parentID: string, ab: AudioBuffer, defaultSetting: AnalyzeDefault, postMessage: postMessage) {
        super();
        this.audioBuffer = ab;
        this.defaultSetting = defaultSetting;
        this.postMessage = postMessage;

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
                        <option value="1024">1024</option>
                        <option value="2048">2048</option>
                        <option value="4096">4096</option>
                        <option value="8192">8192</option>
                        <option value="16384">16384</option>
                        <option value="32768">32768</option>
                    </select>
                </div>
                <div>
                    frequency range:
                    <input id="analyze-min-frequency" type="number" step="1000">Hz ~
                    <input id="analyze-max-frequency" type="number" step="1000">Hz
                </div>
                <div>
                    time range:
                    <input id="analyze-min-time" type="number" step="0.1">s ~
                    <input id="analyze-max-time" type="number" step="0.1">s
                </div>
                <div>
                    waveform amplitude range:
                    <input id="analyze-min-amplitude" type="number" step="0.1"> ~
                    <input id="analyze-max-amplitude" type="number" step="0.1">
                </div>
                <div>
                    <div>
                        spectrogram amplitude range:
                        <input id="analyze-spectrogram-amplitude-range" type="number" step="10">dB ~ 0dB
                    </div>
                    <div>
                        color:
                        <canvas id="analyze-spectrogram-color-axis" width="800px" height="40px"></canvas>
                        <canvas id="analyze-spectrogram-color" width="100px" height="5px"></canvas>
                    </div>
                </div>
            </div>
            <div id="analyze-result-box"></div>
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
        this._register(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveDate(e.data)));
    }

    clearAnalyzeResult() {
        for (const c of Array.from(this.analyzeResultBox.children)) {
            this.analyzeResultBox.removeChild(c);
        }
        this.spectrogramCanvasList = [];
        this.spectrogramCanvasContexts = [];
    }

    activate(autoAnalyze: boolean) {
        // init default analyze settings
        this.initAnalyzeSettings();

        // enable analyze button
        this.analyzeSettingButton.style.display = "block";
        this.analyzeButton.style.display = "block";
        if (autoAnalyze) {
            this.analyzeButton.click();
        }
    }

    onReceiveDate(msg: ExtMessage) {
        switch (msg.type) {
            case ExtMessageType.Data: {
                if (msg.data.wholeLength <= msg.data.end) {
                    this.activate(msg.data.autoAnalyze);
                }
                break;
            }

            case ExtMessageType.MakeSpectrogram: {
                this.postMessage({
                    type: WebviewMessageType.Spectrogram,
                    data: {
                        channel: msg.data.channel,
                        startBlockIndex: 0,
                        blockSize: 60,
                        settings: msg.data.settings
                    }
                });
                break;
            }

            case ExtMessageType.Spectrogram: {
                if (msg.data.settings.analyzeID !== this.latestAnalyzeID) break; // cancel old analyze
                this.drawSpectrogram(msg);
                if (msg.data.isEnd) break;
                this.postMessage({
                    type: WebviewMessageType.Spectrogram,
                    data: {
                        channel: msg.data.channel,
                        startBlockIndex: msg.data.endBlockIndex,
                        blockSize: 60,
                        settings: msg.data.settings
                    }
                });
                break;
            }
        }
    }

    validateRangeValues(
        targetMin: number, targetMax: number,
        validMin: number, validMax: number,
        defaultMin: number, defaultMax: number
    ): number[] {
        let minValue = targetMin, maxValue = targetMax;
        if (!Number.isFinite(minValue) || minValue < validMin) {
            minValue = defaultMin;
        }

        if (!Number.isFinite(maxValue) || validMax < maxValue) {
            maxValue = defaultMax;
        }

        if (maxValue <= minValue) {
            minValue = defaultMin;
            maxValue = defaultMax;
        }

        return [minValue, maxValue];
    }

    getSpectrogramColor(amp: number, range: number): string {
        if (amp == null) return "rgb(0,0,0)";
        const classNum = 6;
        const classWidth = range / classNum;
        const ampClass = Math.floor(amp / classWidth);
        const classMinAmp = (ampClass + 1) * classWidth;
        const value = (amp - classMinAmp) / -classWidth;
        switch (ampClass) {
            case 0:
                return `rgb(255,255,${125 + Math.floor(value * 130)})`;
            case 1:
                return `rgb(255,${125 + Math.floor(value * 130)},125)`;
            case 2:
                return `rgb(255,${Math.floor(value * 125)},125)`;
            case 3:
                return `rgb(${125 + Math.floor(value * 130)},0,125)`;
            case 4:
                return `rgb(${Math.floor(value * 125)},0,125)`;
            case 5:
                return `rgb(0,0,${Math.floor(value * 125)})`;
            default:
                return `rgb(0,0,0)`;
        }
    }

    initAnalyzeSettings() {
        // init fft window size
        const windowSizeSelect = <HTMLSelectElement>document.getElementById("analyze-window-size");
        let defaultWindowSizeIndex = this.defaultSetting.windowSizeIndex;
        if (defaultWindowSizeIndex === undefined || defaultWindowSizeIndex < 0 || 7 < defaultWindowSizeIndex) {
            defaultWindowSizeIndex = 2; // 2:1024
        }
        windowSizeSelect.selectedIndex = defaultWindowSizeIndex;
        // update default
        this.defaultSetting.windowSizeIndex = defaultWindowSizeIndex;

        // init default frequency
        const [minFrequency, maxFrequency] = this.validateRangeValues(
            this.defaultSetting.minFrequency, this.defaultSetting.maxFrequency,
            0, this.audioBuffer.sampleRate / 2,
            0, this.audioBuffer.sampleRate / 2
        );
        const minFreqInput = <HTMLInputElement>document.getElementById("analyze-min-frequency");
        const maxFreqInput = <HTMLInputElement>document.getElementById("analyze-max-frequency");
        minFreqInput.value = `${minFrequency}`;
        maxFreqInput.value = `${maxFrequency}`;
        // update default
        this.defaultSetting.minFrequency = minFrequency;
        this.defaultSetting.maxFrequency = maxFrequency;

        // init default time range
        const minTime = 0, maxTime = this.audioBuffer.duration;
        const minTimeInput = <HTMLInputElement>document.getElementById("analyze-min-time");
        const maxTimeInput = <HTMLInputElement>document.getElementById("analyze-max-time");
        minTimeInput.value = `${minTime}`;
        maxTimeInput.value = `${maxTime}`;

        // calc min & max amplitude
        let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
        for (let ch = 0; ch < this.audioBuffer.numberOfChannels; ch++) {
            const chData = this.audioBuffer.getChannelData(ch);
            for (let i = 0; i < chData.length; i++) {
                const v = chData[i];
                if (v < min) min = v;
                if (max < v) max = v;
            }
        }
        // init default amplitude
        const [minAmplitude, maxAmplitude] = this.validateRangeValues(
            this.defaultSetting.minAmplitude, this.defaultSetting.maxAmplitude,
            -100, 100,
            min, max
        );
        const minAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-min-amplitude");
        const maxAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-max-amplitude");
        minAmplitudeInput.value = `${minAmplitude}`;
        maxAmplitudeInput.value = `${maxAmplitude}`;
        // update default
        this.defaultSetting.minAmplitude = minAmplitude;
        this.defaultSetting.maxAmplitude = maxAmplitude;

        // init spectrogram amplitude range
        const [spectrogramAmplitudeRange, _] = this.validateRangeValues(
            this.defaultSetting.spectrogramAmplitudeRange, 0,
            -1000, 0,
            -90, 0
        );
        const spectrogramAmplitudeRangeInput = <HTMLInputElement>document.getElementById("analyze-spectrogram-amplitude-range");
        spectrogramAmplitudeRangeInput.value = `${spectrogramAmplitudeRange}`;
        // update default
        this.defaultSetting.spectrogramAmplitudeRange = spectrogramAmplitudeRange;
        // init default color bar
        const colorCanvas = <HTMLCanvasElement>document.getElementById("analyze-spectrogram-color");
        const colorAxisCanvas = <HTMLCanvasElement>document.getElementById("analyze-spectrogram-color-axis");
        const colorContext = colorCanvas.getContext("2d", { alpha: false });
        const colorAxisContext = colorAxisCanvas.getContext("2d", { alpha: false });
        // draw axis label
        colorAxisContext.font = `15px Arial`;
        colorAxisContext.fillStyle = "white";
        for (let i = 0; i < 10; i++) {
            const amp = i * spectrogramAmplitudeRange / 10;
            const x = i * colorAxisCanvas.width / 10;
            colorAxisContext.fillText(`${amp}dB`, x, colorAxisCanvas.height);
        }
        // draw color
        for (let i = 0; i < 100; i++) {
            const amp = i * spectrogramAmplitudeRange / 100;
            const x = i * colorCanvas.width / 100;
            colorContext.fillStyle = this.getSpectrogramColor(amp, spectrogramAmplitudeRange);
            colorContext.fillRect(x, 0, colorCanvas.width / 100, colorCanvas.height);
        }
    }

    getAnalyzeSettings(): AnalyzeSettings {
        // get windowsize
        const windowSizeSelect = <HTMLSelectElement>document.getElementById("analyze-window-size");
        const windowSize = Number(windowSizeSelect.value);
        windowSizeSelect.value = `${windowSize}`;

        // get frequency range
        const minFreqInput = <HTMLInputElement>document.getElementById("analyze-min-frequency");
        const maxFreqInput = <HTMLInputElement>document.getElementById("analyze-max-frequency");
        const [minFrequency, maxFrequency] = this.validateRangeValues(
            Number(minFreqInput.value), Number(maxFreqInput.value),
            0, this.audioBuffer.sampleRate / 2,
            this.defaultSetting.minFrequency, this.defaultSetting.maxFrequency
        );
        minFreqInput.value = `${minFrequency}`;
        maxFreqInput.value = `${maxFrequency}`;

        // get time range
        const minTimeInput = <HTMLInputElement>document.getElementById("analyze-min-time");
        const maxTimeInput = <HTMLInputElement>document.getElementById("analyze-max-time");
        const [minTime, maxTime] = this.validateRangeValues(
            Number(minTimeInput.value), Number(maxTimeInput.value),
            0, this.audioBuffer.duration,
            0, this.audioBuffer.duration
        );
        minTimeInput.value = `${minTime}`;
        maxTimeInput.value = `${maxTime}`;

        // get amplitude range
        const minAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-min-amplitude");
        const maxAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-max-amplitude");
        const [minAmplitude, maxAmplitude] = this.validateRangeValues(
            Number(minAmplitudeInput.value), Number(maxAmplitudeInput.value),
            -1000, 1000,
            this.defaultSetting.minAmplitude, this.defaultSetting.maxAmplitude
        );
        minAmplitudeInput.value = `${minAmplitude}`;
        maxAmplitudeInput.value = `${maxAmplitude}`;

        // Calc hopsize
        // This hopSize make rectWidth greater then minRectWidth for every duration of input.
        // Thus, spectrogram of long duration input can be drawn as faster as short duration one.
        // But we use minimum hopSize not to be too small for shsort duration data
        let minRectWidth = 4 * windowSize / 1024;
        const hopSize = Math.max(
            Math.trunc(minRectWidth * (maxTime - minTime) * this.audioBuffer.sampleRate / 1800),
            windowSize / 4
        );

        // get spectrogram amplitude range
        const spectrogramAmplitudeRangeInput = <HTMLInputElement>document.getElementById("analyze-spectrogram-amplitude-range");
        const [spectrogramAmplitudeRange, _] = this.validateRangeValues(
            Number(spectrogramAmplitudeRangeInput.value), 0,
            -1000, 0,
            -90, 0
        );
        spectrogramAmplitudeRangeInput.value = `${spectrogramAmplitudeRange}`;
        // update color bar
        const colorCanvas = <HTMLCanvasElement>document.getElementById("analyze-spectrogram-color");
        const colorAxisCanvas = <HTMLCanvasElement>document.getElementById("analyze-spectrogram-color-axis");
        const colorContext = colorCanvas.getContext("2d", { alpha: false });
        const colorAxisContext = colorAxisCanvas.getContext("2d", { alpha: false });
        // draw axis label
        colorAxisContext.fillStyle = "black";
        colorAxisContext.fillRect(0, 0, colorAxisCanvas.width, colorAxisCanvas.height);
        colorAxisContext.font = `15px Arial`;
        colorAxisContext.fillStyle = "white";
        for (let i = 0; i < 10; i++) {
            const amp = i * spectrogramAmplitudeRange / 10;
            const x = i * colorAxisCanvas.width / 10;
            colorAxisContext.fillText(`${amp}dB`, x, colorAxisCanvas.height);
        }
        // draw color
        colorContext.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
        for (let i = 0; i < 100; i++) {
            const amp = i * spectrogramAmplitudeRange / 100;
            const x = i * colorCanvas.width / 100;
            colorContext.fillStyle = this.getSpectrogramColor(amp, spectrogramAmplitudeRange);
            colorContext.fillRect(x, 0, colorCanvas.width / 100, colorCanvas.height);
        }
        return {
            windowSize,
            minFrequency,
            maxFrequency,
            minTime,
            maxTime,
            minAmplitude,
            maxAmplitude,
            hopSize,
            spectrogramAmplitudeRange,
            analyzeID: ++this.latestAnalyzeID
        };
    }

    analyze() {
        this.analyzeButton.style.display = "none";
        this.clearAnalyzeResult();

        const settings = this.getAnalyzeSettings();

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
        this._register(new Event(inputSeekbar, EventType.Change, () => {
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
        context.fillStyle = "rgb(160,60,200)";
        canvasBox.appendChild(canvas);

        const axisCanvas = document.createElement("canvas");
        axisCanvas.className = "axis-canvas";
        axisCanvas.width = width;
        axisCanvas.height = height;
        const axisContext = axisCanvas.getContext("2d");
        axisContext.font = `12px Arial`;
        for (let i = 0; i < 10; i++) {
            axisContext.fillStyle = "rgb(245,130,32)";
            const x = Math.round(i * width / 10);
            const t = i * (settings.maxTime - settings.minTime) / 10 + settings.minTime;
            if (i !== 0) axisContext.fillText(`${(t).toFixed(2)}`, x, 10); // skip first label
            const y = Math.round((i + 1) * height / 10);
            const a = (i + 1) * (settings.minAmplitude - settings.maxAmplitude) / 10 + settings.maxAmplitude;
            axisContext.fillText(`${(a).toFixed(2)}`, 4, y - 2);

            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < height; j++) axisContext.fillRect(x, j, 1, 1);
            for (let j = 0; j < width; j++) axisContext.fillRect(j, y, 1, 1);
        }
        canvasBox.appendChild(axisCanvas);

        this.analyzeResultBox.appendChild(canvasBox);

        const startIndex = Math.floor(settings.minTime * this.audioBuffer.sampleRate);
        const endIndex = Math.floor(settings.maxTime * this.audioBuffer.sampleRate);
        // limit data size
        // thus, drawing waveform of long duration input can be done in about the same amount of time as short input
        const step = Math.ceil((endIndex - startIndex) / 200000);
        const data = this.audioBuffer.getChannelData(ch).slice(startIndex, endIndex).filter((_, i) => i % step === 0);
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

    drawWaveForm(
        data: Float32Array, context: CanvasRenderingContext2D,
        start: number, count: number, width: number, height: number, analyzeID: number
    ) {
        for (let i = 0; i < count; i++) {
            const x = Math.round(((start + i) / data.length) * width);
            const y = Math.round(height * (1 - data[start + i]));
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
        axisContext.font = `20px Arial`;
        for (let i = 0; i < 10; i++) {
            axisContext.fillStyle = "rgb(245,130,32)";
            const x = Math.round(i * width / 10);
            const t = i * (settings.maxTime - settings.minTime) / 10 + settings.minTime;
            if (i !== 0) axisContext.fillText(`${(t).toFixed(2)}`, x, 18);
            const y = Math.round(i * height / 10);
            const f = (10 - i) * (settings.maxFrequency - settings.minFrequency) / 10 + settings.minFrequency;
            axisContext.fillText(`${Math.trunc(f)}`, 4, y - 4);

            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < height; j++) axisContext.fillRect(x, j, 2, 2);
            for (let j = 0; j < width; j++) axisContext.fillRect(j, y, 2, 2);
        }

        canvasBox.appendChild(axisCanvas);

        this.analyzeResultBox.appendChild(canvasBox);

        this.postMessage({
            type: WebviewMessageType.MakeSpectrogram, data: { channel: ch, settings }
        });
    }

    drawSpectrogram(msg: ExtSpectrogramMessage) {
        const ch = msg.data.channel;
        const canvas = this.spectrogramCanvasList[ch];
        const context = this.spectrogramCanvasContexts[ch];
        if (!canvas || !context) return;

        const width = canvas.width;
        const height = canvas.height;
        const spectrogram = msg.data.spectrogram;
        const wholeSampleNum = (msg.data.settings.maxTime - msg.data.settings.minTime) * this.audioBuffer.sampleRate;
        const rectWidth = width * msg.data.settings.hopSize / wholeSampleNum;

        for (let i = 0; i < spectrogram.length; i++) {
            const x = width * (((i + msg.data.startBlockIndex) * msg.data.settings.hopSize) / wholeSampleNum);
            const rectHeight = height / spectrogram[i].length;
            for (let j = 0; j < spectrogram[i].length; j++) {
                const y = height * (1 - (j / spectrogram[i].length));

                const value = spectrogram[i][j];
                context.fillStyle = this.getSpectrogramColor(value, msg.data.settings.spectrogramAmplitudeRange);
                context.fillRect(x, y, rectWidth, rectHeight);
            }
        }
    }
}
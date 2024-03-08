import { AnalyzeDefault, AnalyzeSettingsProps } from '../../config';
import { Disposable } from '../../dispose';
import { EventType, Event } from '../events';
import AnalyzeService from '../service/analyzeService';
import AnalyzeSettingsService from '../service/analyzeSettingsService';

export default class AnalyzerComponent extends Disposable {
    private _audioBuffer: AudioBuffer;
    private _defaultSetting: AnalyzeDefault;
    private _analyzeService: AnalyzeService;
    private _analyzeSettingsService: AnalyzeSettingsService;

    private _analyzeButton: HTMLButtonElement;
    private _analyzeSettingButton: HTMLButtonElement;

    private _analyzeResultBox: HTMLElement;
    private _spectrogramCanvasList: HTMLCanvasElement[] = [];
    private _spectrogramCanvasContexts: CanvasRenderingContext2D[] = [];

    private _latestAnalyzeID: string;

    constructor(
        parentID: string,
        audioBuffer: AudioBuffer, 
        analyzeService: AnalyzeService,
        analyzeSettingsService: AnalyzeSettingsService, 
        defaultSetting: AnalyzeDefault, 
        autoAnalyze: boolean
    ) {
        super();
        this._audioBuffer = audioBuffer;
        this._analyzeService = analyzeService;
        this._analyzeSettingsService = analyzeSettingsService;
        this._defaultSetting = defaultSetting;

        // init base html
        const parent = document.getElementById(parentID);
        parent.innerHTML = `
            <div id="analyze-controller-buttons">
                <div>analyze</div>
                <button id="analyze-button">analyze</button>
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

        // init analyze setting menu
        document.getElementById("analyze-setting").style.display = "none";
        this._analyzeSettingButton = <HTMLButtonElement>document.getElementById("analyze-setting-button");
        this._analyzeSettingButton.onclick = () => {
            const settings = document.getElementById("analyze-setting");
            if (settings.style.display !== "block") {
                settings.style.display = "block";
                this._analyzeSettingButton.textContent = "▲settings";
            } else {
                settings.style.display = "none";
                this._analyzeSettingButton.textContent = "▼settings";
            }
        };
        this.initAnalyzerSetting();

        // init analyze button
        this._analyzeButton = <HTMLButtonElement>document.getElementById("analyze-button");
        this._analyzeButton.onclick = () => { this.analyze(); };

        // init analyze result box
        this._analyzeResultBox = document.getElementById("analyze-result-box");

        // analyze if user set autoAnalyze true
        if (autoAnalyze) this.analyze();
    }

    private initAnalyzerSetting() {
        const settings = this._analyzeSettingsService;

        // init fft window size
        const windowSizeSelect = <HTMLSelectElement>document.getElementById("analyze-window-size");
        windowSizeSelect.selectedIndex = this._defaultSetting.windowSizeIndex;
        this._register(new Event(windowSizeSelect, EventType.Change, () => { settings.windowSize = 2 ** (windowSizeSelect.selectedIndex + 8); }));

        // init frequency range input
        const minFreqInput = <HTMLInputElement>document.getElementById("analyze-min-frequency");
        minFreqInput.value = `${settings.minFrequency}`;
        this._register(new Event(minFreqInput, EventType.Change, () => { settings.minFrequency = Number(minFreqInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateMinFrequency, (e: CustomEventInit) => { minFreqInput.value = `${e.detail.value}`; }));
        
        const maxFreqInput = <HTMLInputElement>document.getElementById("analyze-max-frequency");
        maxFreqInput.value = `${settings.maxFrequency}`;
        this._register(new Event(maxFreqInput, EventType.Change, () => { settings.maxFrequency = Number(maxFreqInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateMaxFrequency, (e: CustomEventInit) => { maxFreqInput.value = `${e.detail.value}`; }));

        // init time range input
        const minTimeInput = <HTMLInputElement>document.getElementById("analyze-min-time");
        minTimeInput.value = `${settings.minTime}`;
        this._register(new Event(minTimeInput, EventType.Change, () => { settings.minTime = Number(minTimeInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateMinTime, (e: CustomEventInit) => { minTimeInput.value = `${e.detail.value}`; }));

        const maxTimeInput = <HTMLInputElement>document.getElementById("analyze-max-time");
        maxTimeInput.value = `${settings.maxTime}`;
        this._register(new Event(maxTimeInput, EventType.Change, () => { settings.maxTime = Number(maxTimeInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateMaxTime, (e: CustomEventInit) => { maxTimeInput.value = `${e.detail.value}`; }));

        // init amplitude range input
        const minAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-min-amplitude");
        minAmplitudeInput.value = `${settings.minAmplitude}`;
        this._register(new Event(minAmplitudeInput, EventType.Change, () => { settings.minAmplitude = Number(minAmplitudeInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateMinAmplitude, (e: CustomEventInit) => { minAmplitudeInput.value = `${e.detail.value}`; }));

        const maxAmplitudeInput = <HTMLInputElement>document.getElementById("analyze-max-amplitude");
        maxAmplitudeInput.value = `${settings.maxAmplitude}`;
        this._register(new Event(maxAmplitudeInput, EventType.Change, () => { settings.maxAmplitude = Number(maxAmplitudeInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateMaxAmplitude, (e: CustomEventInit) => { maxAmplitudeInput.value = `${e.detail.value}`; }));

        // init spectrogram amplitude range input
        const spectrogramAmplitudeRangeInput = <HTMLInputElement>document.getElementById("analyze-spectrogram-amplitude-range");
        spectrogramAmplitudeRangeInput.value = `${settings.spectrogramAmplitudeRange}`;
        this.updateColorBar(settings);
        this._register(new Event(spectrogramAmplitudeRangeInput, EventType.Change, () => { settings.spectrogramAmplitudeRange = Number(spectrogramAmplitudeRangeInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateSpectrogramAmplitudeRange, (e: CustomEventInit) => { 
            spectrogramAmplitudeRangeInput.value = `${e.detail.value}`; 
            this.updateColorBar(settings);
        }));
    }

    private updateColorBar(settings: AnalyzeSettingsProps) {
        // init color bar
        const colorCanvas = <HTMLCanvasElement>document.getElementById("analyze-spectrogram-color");
        const colorAxisCanvas = <HTMLCanvasElement>document.getElementById("analyze-spectrogram-color-axis");
        const colorContext = colorCanvas.getContext("2d", { alpha: false });
        const colorAxisContext = colorAxisCanvas.getContext("2d", { alpha: false });
        // clear axis label
        colorAxisContext.clearRect(0, 0, colorAxisCanvas.width, colorAxisCanvas.height);
        // draw axis label
        colorAxisContext.font = `15px Arial`;
        colorAxisContext.fillStyle = "white";
        for (let i = 0; i < 10; i++) {
            const amp = i * settings.spectrogramAmplitudeRange / 10;
            const x = i * colorAxisCanvas.width / 10;
            colorAxisContext.fillText(`${amp}dB`, x, colorAxisCanvas.height);
        }
        // draw color
        for (let i = 0; i < 100; i++) {
            const amp = i * settings.spectrogramAmplitudeRange / 100;
            const x = i * colorCanvas.width / 100;
            colorContext.fillStyle = this._analyzeService.getSpectrogramColor(amp, settings.spectrogramAmplitudeRange);
            colorContext.fillRect(x, 0, colorCanvas.width / 100, colorCanvas.height);
        }
    }

    private clearAnalyzeResult() {
        for (const c of Array.from(this._analyzeResultBox.children)) {
            this._analyzeResultBox.removeChild(c);
        }
        this._spectrogramCanvasList = [];
        this._spectrogramCanvasContexts = [];
    }

    private showWaveForm(ch: number, settings: AnalyzeSettingsProps) {
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

        this._analyzeResultBox.appendChild(canvasBox);

        const startIndex = Math.floor(settings.minTime * this._audioBuffer.sampleRate);
        const endIndex = Math.floor(settings.maxTime * this._audioBuffer.sampleRate);
        // limit data size
        // thus, drawing waveform of long duration input can be done in about the same amount of time as short input
        const step = Math.ceil((endIndex - startIndex) / 200000);
        const data = this._audioBuffer.getChannelData(ch).slice(startIndex, endIndex).filter((_, i) => i % step === 0);
        // convert data. this is not a normalization.
        // setting.maxAmplitude and setting.minAmplitude is not a min and max of data, but a figure's Y axis range.
        // data is converted to satisfy setting.maxAmplitude=1 and setting.minAmplitude=0
        // samples out of range is not displayed. 
        for (let i = 0; i < data.length; i++) {
            data[i] = (data[i] - settings.minAmplitude) / (settings.maxAmplitude - settings.minAmplitude);
        }

        // call draw in requestAnimationFrame not to block ui
        requestAnimationFrame(() => this.drawWaveForm(data, context, 0, 10000, width, height, settings.analyzeID));
    }

    private drawWaveForm(
        data: Float32Array, context: CanvasRenderingContext2D,
        start: number, count: number, width: number, height: number, analyzeID: string
    ) {
        for (let i = 0; i < count; i++) {
            const x = Math.round(((start + i) / data.length) * width);
            const y = Math.round(height * (1 - data[start + i]));
            context.fillRect(x, y, 1, 1);
        }

        if (start + count < this._audioBuffer.length) {
            // cancel drawing for old analyzeID
            if (analyzeID !== this._latestAnalyzeID) return;
            // call draw in requestAnimationFrame not to block ui
            requestAnimationFrame(() => this.drawWaveForm(data, context, start + count, count, width, height, analyzeID));
        }
    }

    private showSpectrogram(ch: number, settings: AnalyzeSettingsProps) {
        const width = 1800;
        const height = 600;

        const canvasBox = document.createElement("div");
        canvasBox.className = "canvas-box";

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        canvasBox.appendChild(canvas);
        this._spectrogramCanvasList.push(canvas);
        this._spectrogramCanvasContexts.push(context);

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
        this._analyzeResultBox.appendChild(canvasBox);

        const spectrogram = this._analyzeService.getSpectrogram(ch, settings);
        requestAnimationFrame(() => this.drawSpectrogram(ch, spectrogram, settings));
    }

    private drawSpectrogram(channel: number, spectrogram: number[][], settings: AnalyzeSettingsProps) {
        const canvas = this._spectrogramCanvasList[channel];
        const context = this._spectrogramCanvasContexts[channel];
        if (!canvas || !context) return;

        const width = canvas.width;
        const height = canvas.height;
        
        const wholeSampleNum = (settings.maxTime - settings.minTime) * this._audioBuffer.sampleRate;
        const rectWidth = width * settings.hopSize / wholeSampleNum;
        
        const df = this._audioBuffer.sampleRate / settings.windowSize;
        const minFreqIndex = Math.floor(settings.minFrequency / df);
        const maxFreqIndex = Math.floor(settings.maxFrequency / df);
        const rectHeight = height / (maxFreqIndex - minFreqIndex);

        for (let i = 0; i < spectrogram.length; i++) {
            const x = i * rectWidth;
            for (let j = 0; j < spectrogram[i].length; j++) {
                const y = height - (j + 1) * rectHeight;
                const value = spectrogram[i][j];
                context.fillStyle = this._analyzeService.getSpectrogramColor(value, settings.spectrogramAmplitudeRange);
                context.fillRect(x, y, rectWidth, rectHeight);
            }
        }
    }

    public analyze() {
        // disable analyze button
        this._analyzeButton.style.display = "none";
        // clear previous result
        this.clearAnalyzeResult();

        this._analyzeSettingsService.updateAnalyzeID();
        const settings = this._analyzeSettingsService.toProps();
        this._latestAnalyzeID = settings.analyzeID;

        for (let ch = 0; ch < this._audioBuffer.numberOfChannels; ch++) {
            this.showWaveForm(ch, settings);
            this.showSpectrogram(ch, settings);
        }

        // register seekbar on figures
        const visibleBar = document.createElement("div");
        visibleBar.className = "seek-div";
        this._analyzeResultBox.appendChild(visibleBar);

        const inputSeekbar = document.createElement("input");
        inputSeekbar.type = "range";
        inputSeekbar.className = "input-seek-bar";
        inputSeekbar.step = "0.00001"
        this._analyzeResultBox.appendChild(inputSeekbar);

        this._register(new Event(window, EventType.UpdateSeekbar, (e: CustomEventInit) => {
            const value = e.detail.value;
            const t = value * this._audioBuffer.duration / 100;
            const v = ((t - settings.minTime) / (settings.maxTime - settings.minTime)) * 100;
            const vv = v < 0 ? 0 : 100 < v ? 100 : v;
            visibleBar.style.width = `${vv}%`;
            return 100 < v;
        }));
        this._register(new Event(inputSeekbar, EventType.Change, () => {
            const rv = Number(inputSeekbar.value);
            const nv = ((rv / 100 * (settings.maxTime - settings.minTime) + settings.minTime) / this._audioBuffer.duration) * 100;
            const inputSeekbarEvent = new CustomEvent(EventType.InputSeekbar, {
                detail: {
                    value: nv
                }
            });
            window.dispatchEvent(inputSeekbarEvent);
            inputSeekbar.value = "100";
        }));

        // enable analyze button
        this._analyzeButton.style.display = "block";
    }
    
}
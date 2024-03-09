import { AnalyzeSettingsProps } from '../../config';
import { Disposable } from '../../dispose';
import { EventType, Event } from '../events';
import AnalyzeService from '../service/analyzeService';
import AnalyzeSettingsService from '../service/analyzeSettingsService';
import WaveFormComponent from './waveFormComponent';
import SpectrogramComponent from './spectrogramComponent';

export default class AnalyzerComponent extends Disposable {
    private _audioBuffer: AudioBuffer;
    private _analyzeService: AnalyzeService;
    private _analyzeSettingsService: AnalyzeSettingsService;

    private _analyzeButton: HTMLButtonElement;
    private _analyzeSettingButton: HTMLButtonElement;
    private _analyzeResultBox: HTMLElement;

    constructor(
        parentID: string,
        audioBuffer: AudioBuffer, 
        analyzeService: AnalyzeService,
        analyzeSettingsService: AnalyzeSettingsService, 
        autoAnalyze: boolean
    ) {
        super();
        this._audioBuffer = audioBuffer;
        this._analyzeService = analyzeService;
        this._analyzeSettingsService = analyzeSettingsService;

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
                        <option value="0">256</option>
                        <option value="1">512</option>
                        <option value="2">1024</option>
                        <option value="3">2048</option>
                        <option value="4">4096</option>
                        <option value="5">8192</option>
                        <option value="6">16384</option>
                        <option value="7">32768</option>
                    </select>
                </div>
                <div>
                    frequency scale:
                    <select id="analyze-frequency-scale">
                        <option value="0">Linear</option>
                        <option value="1">Log</option>
                        <option value="2">Mel</option>
                    </select>
                    mel filter num:
                    <input id="analyze-mel-filter-num" type="number" step="10">
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

        // init fft window size index select
        const windowSizeSelect = <HTMLSelectElement>document.getElementById("analyze-window-size");
        windowSizeSelect.selectedIndex = settings.windowSizeIndex;
        this._register(new Event(windowSizeSelect, EventType.Change, () => { settings.windowSizeIndex = Number(windowSizeSelect.selectedIndex); }));
        this._register(new Event(window, EventType.AS_UpdateWindowSizeIndex, (e: CustomEventInit) => { windowSizeSelect.selectedIndex = e.detail.value; }));

        // init frequency scale select
        const frequencyScaleSelect = <HTMLSelectElement>document.getElementById("analyze-frequency-scale");
        frequencyScaleSelect.selectedIndex = settings.frequencyScale;
        this._register(new Event(frequencyScaleSelect, EventType.Change, () => { settings.frequencyScale = frequencyScaleSelect.selectedIndex; }));

        // init mel filter num input
        const melFilterNumInput = <HTMLInputElement>document.getElementById("analyze-mel-filter-num");
        melFilterNumInput.value = `${settings.melFilterNum}`;
        this._register(new Event(melFilterNumInput, EventType.Change, () => { settings.melFilterNum = Number(melFilterNumInput.value); }));
        this._register(new Event(window, EventType.AS_UpdateMelFilterNum, (e: CustomEventInit) => { melFilterNumInput.value = `${e.detail.value}`; }));

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
    }

    public analyze() {
        // disable analyze button
        this._analyzeButton.style.display = "none";
        // clear previous result
        this.clearAnalyzeResult();

        this._analyzeSettingsService.updateAnalyzeID();
        const settings = this._analyzeSettingsService.toProps();

        for (let ch = 0; ch < this._audioBuffer.numberOfChannels; ch++) {
            new WaveFormComponent("analyze-result-box", settings, this._audioBuffer.sampleRate, this._audioBuffer.getChannelData(ch));
            new SpectrogramComponent("analyze-result-box", this._analyzeService, settings, this._audioBuffer.sampleRate, ch);
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
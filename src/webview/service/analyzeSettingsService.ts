import { EventType } from "../events";
import { AnalyzeDefault } from "../../config";

export enum WindowSizeIndex {
    W256 = 0,
    W512 = 1,
    W1024 = 2,
    W2048 = 3,
    W4096 = 4,
    W8192 = 5,
    W16384 = 6,
    W32768 = 7,
}

export enum FrequencyScale {
    Linear = 0,
    Log = 1,
    Mel = 2,
}

export interface AnalyzeSettingsProps {
    waveformVerticalScale: number,
    waveformShowChannelLabel: boolean,
    spectrogramVerticalScale: number,
    spectrogramShowChannelLabel: boolean,
    roundWaveformAxis: boolean;
    roundTimeAxis: boolean;
    windowSize: number;
    hopSize: number;
    minFrequency: number;
    maxFrequency: number;
    minTime: number;
    maxTime: number;
    minAmplitude: number;
    maxAmplitude: number;
    spectrogramAmplitudeRange: number;
    frequencyScale: number;
    melFilterNum: number;
}

export default class AnalyzeSettingsService {
    public readonly WAVEFORM_CANVAS_WIDTH = 1000;
    public readonly WAVEFORM_CANVAS_HEIGHT = 200;
    public static WAVEFORM_CANVAS_VERTICAL_SCALE_MAX = 2.0;
    public static WAVEFORM_CANVAS_VERTICAL_SCALE_MIN = 0.3;
    public readonly SPECTROGRAM_CANVAS_WIDTH = 1800;
    public readonly SPECTROGRAM_CANVAS_HEIGHT = 600;
    public static SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX = 2.0;
    public static SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN = 0.2;

    private _sampleRate: number;
    private _duration: number;

    private _minAmplitudeOfAudioBuffer: number;
    public get minAmplitudeOfAudioBuffer() { return this._minAmplitudeOfAudioBuffer; }

    private _maxAmplitudeOfAudioBuffer: number;
    public get maxAmplitudeOfAudioBuffer() { return this._maxAmplitudeOfAudioBuffer; }

    private _autoCalcHopSize: boolean = true;
    public set autoCalsHopSize(value: boolean) { this._autoCalcHopSize = value; }

    private _waveformVisible: boolean;
    public get waveformVisible() { return this._waveformVisible; }
    public set waveformVisible(value: boolean) {
        this._waveformVisible = value == undefined ? true : value;      // true by default
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateWaveformVisible, { detail: { value: this._waveformVisible }}))
    }

    private _waveformVerticalScale: number;
    public get waveformVerticalScale() { return this._waveformVerticalScale; }
    public set waveformVerticalScale(value: number) {
        let val = value == undefined ? 1.0 : value;      // 1.0 by default

        if (val < AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MIN) val = AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MIN;
        if (AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MAX < val) val = AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MAX; 
        this._waveformVerticalScale = val;
    }

    private _waveformShowChannelLabel: boolean;
    public get waveformShowChannelLabel() { return this._waveformShowChannelLabel; }
    public set waveformShowChannelLabel(value: boolean) {
        this._waveformShowChannelLabel = value == undefined ? false : value;       // false by default
    }

    private _spectrogramVisible: boolean;
    public get spectrogramVisible() { return this._spectrogramVisible; }
    public set spectrogramVisible(value: boolean) {
        this._spectrogramVisible = value == undefined ? true : value;       // true by default
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateSpectrogramVisible, { detail: { value: this._spectrogramVisible }}))
    }

    private _spectrogramVerticalScale: number;
    public get spectrogramVerticalScale() { return this._spectrogramVerticalScale; }
    public set spectrogramVerticalScale(value: number) {
        let val = value == undefined ? 1.0 : value;      // 1.0 by default

        if (val < AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN) val = AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN;
        if (AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX < val) val = AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX; 
        this._spectrogramVerticalScale = val;
    }

    private _spectrogramShowChannelLabel: boolean;
    public get spectrogramShowChannelLabel() { return this._spectrogramShowChannelLabel; }
    public set spectrogramShowChannelLabel(value: boolean) {
        this._spectrogramShowChannelLabel = value == undefined ? false : value;       // false by default
    }

    private _roundWaveformAxis: boolean;
    public get roundWaveformAxis() { return this._roundWaveformAxis; }
    public set roundWaveformAxis(value: boolean) {
        this._roundWaveformAxis = value == undefined ? true : value;       // true by default
    }

    private _roundTimeAxis: boolean;
    public get roundTimeAxis() { return this._roundTimeAxis; }
    public set roundTimeAxis(value: boolean) {
        this._roundTimeAxis = value == undefined ? true : value;       // true by default
    }

    private _windowSizeIndex: number;
    public get windowSizeIndex() { return this._windowSizeIndex; }
    public set windowSizeIndex(value: number) {
        const windowSizeIndex = this.getValueInEnum(value, WindowSizeIndex, WindowSizeIndex.W1024);
        this._windowSizeIndex = windowSizeIndex;
        this.windowSize = 2 ** (windowSizeIndex + 8);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateWindowSizeIndex, { detail: { value: this._windowSizeIndex }}))
    }

    private _windowSize: number;
    public get windowSize() { return this._windowSize; }
    public set windowSize(value: number) { 
        this._windowSize = value;
        if (this._autoCalcHopSize) {
            this.hopSize = this.calcHopSize();
        }
    }

    private _hopSize: number;
    public get hopSize() { return this._hopSize; }
    public set hopSize(value: number) { this._hopSize = value; }

    private _minFrequency: number;
    public get minFrequency() { return this._minFrequency; }
    public set minFrequency(value: number) { 
        const [minFrequency, _] = this.getRangeValues(
            value, this.maxFrequency,
            0, this._sampleRate / 2,
            0, this._sampleRate / 2
        );
        this._minFrequency = minFrequency;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMinFrequency, { detail: { value: this._minFrequency }}))
    }

    private _maxFrequency: number;
    public get maxFrequency() { return this._maxFrequency; }
    public set maxFrequency(value: number) {
        const [_, maxFrequency] = this.getRangeValues(
            this.minFrequency, value,
            0, this._sampleRate / 2,
            0, this._sampleRate / 2
        );
        this._maxFrequency = maxFrequency;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMaxFrequency, { detail: { value: this._maxFrequency }}))
    }

    private _minTime: number;
    public get minTime() { return this._minTime; }
    public set minTime(value: number) {
        const [minTime, _] = this.getRangeValues(
            value, this.maxTime,
            0, this._duration,
            0, this._duration
        );
        this._minTime = minTime;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMinTime, { detail: { value: this._minTime }}))
    }

    private _maxTime: number;
    public get maxTime() { return this._maxTime; }
    public set maxTime(value: number) {
        const [_, maxTime] = this.getRangeValues(
            this.minTime, value,
            0, this._duration,
            0, this._duration
        );
        this._maxTime = maxTime;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMaxTime, { detail: { value: this._maxTime }}))
    }

    private _minAmplitude: number;
    public get minAmplitude() { return this._minAmplitude; }
    public set minAmplitude(value: number) {
        const [minAmplitude, _] = this.getRangeValues(
            value, this.maxAmplitude,
            -100, 100,
            this._minAmplitudeOfAudioBuffer, this._maxAmplitudeOfAudioBuffer
        );
        this._minAmplitude = minAmplitude;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMinAmplitude, { detail: { value: this._minAmplitude }}))
    }

    private _maxAmplitude: number;
    public get maxAmplitude() { return this._maxAmplitude; }
    public set maxAmplitude(value: number) {
        const [_, maxAmplitude] = this.getRangeValues(
            this.minAmplitude, value,
            -100, 100,
            this._minAmplitudeOfAudioBuffer, this._maxAmplitudeOfAudioBuffer
        );
        this._maxAmplitude = maxAmplitude;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMaxAmplitude, { detail: { value: this._maxAmplitude }}))
    }

    private _spectrogramAmplitudeRange: number;
    public get spectrogramAmplitudeRange() { return this._spectrogramAmplitudeRange; }
    public set spectrogramAmplitudeRange(value: number) {
        const [spectrogramAmplitudeRange, _] = this.getRangeValues(
            value, 0,
            -1000, 0,
            -90, 0
        );
        this._spectrogramAmplitudeRange = spectrogramAmplitudeRange;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateSpectrogramAmplitudeRange, { detail: { value: this._spectrogramAmplitudeRange }}))
    }

    private _frequencyScale: FrequencyScale;
    public get frequencyScale() { return this._frequencyScale; }
    public set frequencyScale(value: FrequencyScale) {
        const frequencyScale = this.getValueInEnum(value, FrequencyScale, FrequencyScale.Linear);
        this._frequencyScale = frequencyScale;
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateFrequencyScale, { detail: { value: this._frequencyScale }}))
    }

    private _melFilterNum: number;
    public get melFilterNum() { return this._melFilterNum; }
    public set melFilterNum(value: number) {
        this._melFilterNum = this.getValueInRange(Math.trunc(value), 20, 200, 40);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMelFilterNum, { detail: { value: this._melFilterNum }}))
    }

    private constructor(waveformVisible: boolean, waveformVerticalScale: number, waveformShowChannelLabel: boolean, spectrogramVisible: boolean, spectrogramVerticalScale: number, spectrogramShowChannelLabel: boolean,
                        windowSize: number, hopSize: number, minFrequency: number, maxFrequency: number, minTime: number, maxTime: number, minAmplitude: number, maxAmplitude: number, spectrogramAmplitudeRange: number) {
        this._waveformVisible = waveformVisible;
        this._waveformVerticalScale = waveformVerticalScale;
        this._waveformShowChannelLabel = waveformShowChannelLabel;
        this._spectrogramVisible = spectrogramVisible;
        this._spectrogramVerticalScale = spectrogramVerticalScale;
        this._spectrogramShowChannelLabel = spectrogramShowChannelLabel;
        this._windowSize = windowSize;
        this._hopSize = hopSize;
        this._minFrequency = minFrequency;
        this._maxFrequency = maxFrequency;
        this._minTime = minTime;
        this._maxTime = maxTime;
        this._minAmplitude = minAmplitude;
        this._maxAmplitude = maxAmplitude;
        this._spectrogramAmplitudeRange = spectrogramAmplitudeRange;
    }

    public static fromDefaultSetting(defaultSetting: AnalyzeDefault, audioBuffer: AudioBuffer) {
        // calc min & max amplitude
        let min  = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const chData = audioBuffer.getChannelData(ch);
            for (let i = 0; i < chData.length; i++) {
                const v = chData[i];
                if (v < min) min = v;
                if (max < v) max = v;
            }
        }

        // create instance
        const setting = new AnalyzeSettingsService(true, 1.0, false, true, 1.0, false, 1024, 256, 0, audioBuffer.sampleRate / 2, 0, audioBuffer.duration, min, max, -90);

        // set min & max amplitude of audio buffer to instance
        setting._minAmplitudeOfAudioBuffer = min;
        setting._maxAmplitudeOfAudioBuffer = max;
        // set sample rate & duration of audio buffer to instance
        setting._sampleRate = audioBuffer.sampleRate;
        setting._duration = audioBuffer.duration;

        // update the instance props using the values from the default settings

        // init waveform visible
        setting.waveformVisible = defaultSetting.waveformVisible;

        // init waveform vertical scale
        setting.waveformVerticalScale = defaultSetting.waveformVerticalScale;

        // init waveform show channel label
        setting.waveformShowChannelLabel = defaultSetting.waveformShowChannelLabel;

        // init spectrogram visible
        setting.spectrogramVisible = defaultSetting.spectrogramVisible;

        // init spectrogram vertical scale
        setting.spectrogramVerticalScale = defaultSetting.spectrogramVerticalScale;

        // init spectrogram show channel label
        setting.spectrogramShowChannelLabel = defaultSetting.spectrogramShowChannelLabel;

        // init round waveform axis
        setting.roundWaveformAxis = defaultSetting.roundWaveformAxis;

        // init round time axis
        setting.roundTimeAxis = defaultSetting.roundTimeAxis;

        // init fft window size
        setting.windowSizeIndex = defaultSetting.windowSizeIndex;

        // init frequency scale
        setting.frequencyScale = defaultSetting.frequencyScale;

        // init mel filter num
        setting.melFilterNum = defaultSetting.melFilterNum;

        // init default frequency
        setting.minFrequency = defaultSetting.minFrequency;
        setting.maxFrequency = defaultSetting.maxFrequency;

        // init default time range
        setting.minTime = 0;
        setting.maxTime = audioBuffer.duration;
        
        // init default amplitude
        setting.minAmplitude = defaultSetting.minAmplitude;
        setting.maxAmplitude = defaultSetting.maxAmplitude;

        // init spectrogram amplitude range
        setting.spectrogramAmplitudeRange = defaultSetting.spectrogramAmplitudeRange;

        return setting;
    }

    private getRangeValues(
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

    private getValueInRange(targetValue: number, validMin: number, validMax: number, defaultValue: number): number {
        if (!Number.isFinite(targetValue) || targetValue < validMin || validMax < targetValue) {
            return defaultValue;
        }

        return targetValue;
    }

    private getValueInEnum(targetValue: number, enumType: any, defaultValue: number): number {
        if (Object.values(enumType).includes(targetValue)) {
            return targetValue;
        }

        return defaultValue;
    }

    /*
     Calc hopsize
     This hopSize make rectWidth greater than minRectWidth for every duration of input.
     Thus, spectrogram of long duration input can be drawn as faster as short duration one.

     Use a minimum hopSize to prevent from becoming too small for short periods of data.
    */  
    private calcHopSize() {
        const minRectWidth = 2 * this.windowSize / 1024;
        const fullSampleNum = (this.maxTime - this.minTime) * this._sampleRate;
        const enoughHopSize = Math.trunc(minRectWidth * fullSampleNum / this.SPECTROGRAM_CANVAS_WIDTH);
        const minHopSize = this.windowSize / 32;
        const hopSize = Math.max(enoughHopSize, minHopSize);
        return hopSize;
    }

    public toProps(): AnalyzeSettingsProps {
        return {
            waveformVerticalScale: this.waveformVerticalScale,
            waveformShowChannelLabel: this.waveformShowChannelLabel,
            spectrogramVerticalScale: this.spectrogramVerticalScale,
            spectrogramShowChannelLabel: this.spectrogramShowChannelLabel,
            roundWaveformAxis: this.roundWaveformAxis,
            roundTimeAxis: this.roundTimeAxis,
            windowSize: this.windowSize,
            hopSize: this.hopSize,
            minFrequency: this.minFrequency,
            maxFrequency: this.maxFrequency,
            minTime: this.minTime,
            maxTime: this.maxTime,
            minAmplitude: this.minAmplitude,
            maxAmplitude: this.maxAmplitude,
            spectrogramAmplitudeRange: this.spectrogramAmplitudeRange,
            frequencyScale: this.frequencyScale,
            melFilterNum: this.melFilterNum,
        };
    }
}

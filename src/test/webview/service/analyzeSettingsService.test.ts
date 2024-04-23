import { MockAudioBuffer, getRandomFloat, getRandomFloatOutOf, getRandomInt, waitEventForAction } from "../../helper";
import { AnalyzeDefault } from "../../../config";
import AnalyzeSettingsService, { FrequencyScale, WindowSizeIndex } from "../../../webview/service/analyzeSettingsService";
import { EventType } from "../../../webview/events";

describe("fromDefaultSettings", () => {
    let defaultSettings: AnalyzeDefault;
    let audioBuffer: AudioBuffer;
    beforeEach(() => {
        defaultSettings = { 
            waveformVisible: undefined,
            waveformVerticalScale: undefined,
            waveformShowChannelLabel: undefined,
            spectrogramVisible: undefined,
            spectrogramVerticalScale: undefined,
            spectrogramShowChannelLabel: undefined,
            roundWaveformAxis: undefined,
            roundTimeAxis: undefined,
            windowSizeIndex: undefined, 
            minAmplitude: undefined, 
            maxAmplitude: undefined, 
            minFrequency: undefined, 
            maxFrequency: undefined, 
            spectrogramAmplitudeRange: undefined, 
            frequencyScale: undefined, 
            melFilterNum: undefined
        };
        audioBuffer = new MockAudioBuffer(1, 44100, 44100) as unknown as AudioBuffer;
    });

    // waveformVisible
    test("waveformVisible should be true if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVisible).toBe(true);
    });
    test("waveformVisible should be default value", () => {
        defaultSettings.waveformVisible = true;
        let as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVisible).toBe(true);

        defaultSettings.waveformVisible = false;
        as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVisible).toBe(false);
    });

    // waveformVerticalScale
    test("waveformVerticalScale should be 1.0 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVerticalScale).toBe(1.0);
    });
    test("waveformVerticalScale should be default value", () => {
        const waveformVerticalScale = getRandomFloat(AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MIN, AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MAX);
        defaultSettings.waveformVerticalScale = waveformVerticalScale;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVerticalScale).toBe(waveformVerticalScale);
    });
    test("waveformVerticalScale should be in range", () => {
        let waveformVerticalScale = 0.0;
        defaultSettings.waveformVerticalScale = waveformVerticalScale;
        let as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVerticalScale).toBe(AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MIN);

        waveformVerticalScale = 10.0;
        defaultSettings.waveformVerticalScale = waveformVerticalScale;
        as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVerticalScale).toBe(AnalyzeSettingsService.WAVEFORM_CANVAS_VERTICAL_SCALE_MAX);
    });

    // waveformVisible
    test("waveformShowChannelLabel should be false if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformShowChannelLabel).toBe(false);
    });
    test("waveformVisible should be default value (true case)", () => {
        defaultSettings.waveformVisible = true;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVisible).toBe(true);
    });
    test("waveformVisible should be default value (false case)", () => {
        defaultSettings.waveformVisible = false;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.waveformVisible).toBe(false);
    });

    // spectrogramVisible
    test("spectrogramVisible should be true if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramVisible).toBe(true);
    });
    test("spectrogramVisible should be default value", () => {
        defaultSettings.spectrogramVisible = true;
        let as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramVisible).toBe(true);

        defaultSettings.spectrogramVisible = false;
        as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramVisible).toBe(false);
    });

    // spectrogramVerticalScale
    test("spectrogramVerticalScale should be 1.0 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramVerticalScale).toBe(1.0);
    });
    test("spectrogramVerticalScale should be default value", () => {
        const spectrogramVerticalScale = getRandomFloat(AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN, AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX);
        defaultSettings.spectrogramVerticalScale = spectrogramVerticalScale;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramVerticalScale).toBe(spectrogramVerticalScale);
    });
    test("spectrogramVerticalScale should be in range", () => {
        let spectrogramVerticalScale = 0.0;
        defaultSettings.spectrogramVerticalScale = spectrogramVerticalScale;
        let as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramVerticalScale).toBe(AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MIN);

        spectrogramVerticalScale = 10.0;
        defaultSettings.spectrogramVerticalScale = spectrogramVerticalScale;
        as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramVerticalScale).toBe(AnalyzeSettingsService.SPECTROGRAM_CANVAS_VERTICAL_SCALE_MAX);
    });

    // waveformVisible
    test("spectrogramShowChannelLabel should be false if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramShowChannelLabel).toBe(false);
    });
    test("spectrogramShowChannelLabel should be default value (true case)", () => {
        defaultSettings.spectrogramShowChannelLabel = true;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramShowChannelLabel).toBe(true);
    });
    test("spectrogramShowChannelLabel should be default value (false case)", () => {
        defaultSettings.spectrogramShowChannelLabel = false;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramShowChannelLabel).toBe(false);
    });

    // roundWaveformAxis
    test("roundWaveformAxis should be true if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.roundWaveformAxis).toBe(true);
    });
    test("roundWaveformAxis should be default value", () => {
        defaultSettings.roundWaveformAxis = true;
        let as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.roundWaveformAxis).toBe(true);

        defaultSettings.roundWaveformAxis = false;
        as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.roundWaveformAxis).toBe(false);
    });

    // roundTimeAxis
    test("roundTimeAxis should be true if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.roundTimeAxis).toBe(true);
    });
    test("roundTimeAxis should be default value", () => {
        defaultSettings.roundTimeAxis = true;
        let as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.roundTimeAxis).toBe(true);

        defaultSettings.roundTimeAxis = false;
        as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.roundTimeAxis).toBe(false);
    });

    // windowSizeIndex
    test("windowSizeIndex should be W1024 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.windowSizeIndex).toBe(WindowSizeIndex.W1024);
    });
    test("windowSizeIndex should be default value", () => {
        const index = getRandomInt(0, 7);
        defaultSettings.windowSizeIndex = index;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.windowSizeIndex).toBe(index);
    });

    // windowSize
    test("windowSize should be 1024 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.windowSize).toBe(1024);
    });
    test("windowSize should be default value", () => {
        const index = getRandomInt(0, 7);
        const windowSize = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768][index];
        defaultSettings.windowSizeIndex = index;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.windowSize).toBe(windowSize);
    });

    // frequencyScale
    test("frequencyScale should be Linear if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.frequencyScale).toBe(FrequencyScale.Linear);
    });
    test("frequencyScale should be default value", () => {
        const frequencyScale = getRandomInt(0, 2);
        defaultSettings.frequencyScale = frequencyScale;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.frequencyScale).toBe(frequencyScale);
    });

    // melFilterNum
    test("melFilterNum should be 40 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.melFilterNum).toBe(40);
    });
    test("melFilterNum should be default value if its in [20, 200]", () => {
        const melFilterNum = getRandomFloat(20, 200);
        defaultSettings.melFilterNum = melFilterNum;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.melFilterNum).toBe(Math.trunc(melFilterNum));
    });
    test("melFilterNum should be 40 if default value is out of [20, 200]", () => {
        const melFilterNum = getRandomFloatOutOf(20, 200);
        defaultSettings.melFilterNum = melFilterNum;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.melFilterNum).toBe(40);
    });
    test("AS_UpdateMelFilterNum event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.melFilterNum = getRandomFloat(20, 200);
        }, window, EventType.AS_UpdateMelFilterNum);
        expect(detail.value).toBe(as.melFilterNum);
    });

    // minFrequency
    test("minFrequency should be 0 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minFrequency).toBe(0);
    });
    test("minFrequency should be default value if its in [0, sampleRate/2]", () => {
        const minFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
        defaultSettings.minFrequency = minFrequency;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minFrequency).toBeCloseTo(minFrequency);
    });
    test("minFrequency should be 0 if default value is out of [0, sampleRate/2]", () => {
        const minFrequency = getRandomFloatOutOf(0, audioBuffer.sampleRate / 2);
        defaultSettings.minFrequency = minFrequency;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minFrequency).toBeCloseTo(0);
    });
    test("AS_UpdateMinFrequency event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.minFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
        }, window, EventType.AS_UpdateMinFrequency);
        expect(detail.value).toBeCloseTo(as.minFrequency);
    });

    // maxFrequency
    test("maxFrequency should be sampleRate/2 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxFrequency).toBeCloseTo(audioBuffer.sampleRate / 2);
    });
    test("maxFrequency should be default value if its in [0, sampleRate/2]", () => {
        const maxFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
        defaultSettings.maxFrequency = maxFrequency;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxFrequency).toBeCloseTo(maxFrequency);
    });
    test("maxFrequency should be to sampleRate/2 if default value is out of [0, sampleRate/2]", () => {
        const maxFrequency = getRandomFloatOutOf(0, audioBuffer.sampleRate / 2);
        defaultSettings.minFrequency = maxFrequency;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxFrequency).toBeCloseTo(audioBuffer.sampleRate / 2);
    });
    test("AS_UpdateMaxFrequency event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.maxFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
        }, window, EventType.AS_UpdateMaxFrequency);
        expect(detail.value).toBeCloseTo(as.maxFrequency);
    });

    // minTime (not in default settings)
    test("minTime should be 0 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minTime).toBe(0);
    });
    test("AS_UpdateMinTime event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.minTime = getRandomFloat(0, audioBuffer.duration);
        }, window, EventType.AS_UpdateMinTime);
        expect(detail.value).toBeCloseTo(as.minTime);
    });

    // maxTime (not in default settings)
    test("maxTime should be duration if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxTime).toBeCloseTo(audioBuffer.duration);
    });
    test("AS_UpdateMaxTime event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.maxTime = getRandomFloat(0, audioBuffer.duration);
        }, window, EventType.AS_UpdateMaxTime);
        expect(detail.value).toBeCloseTo(as.maxTime);
    });

    // minAmplitude
    test("minAmplitude should be minAmplitudeOfAudioBuffer if no default value is provided", () => {
        const minAmplitude = getRandomFloat(-100, 0);
        audioBuffer.getChannelData(0)[getRandomInt(0,audioBuffer.length)] = minAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minAmplitude).toBeCloseTo(as.minAmplitudeOfAudioBuffer);
    });
    test("minAmplitude should be default value if its in [-100, 100] and smaller than max", () => {
        const maxAmplitude = getRandomFloat(0, 100);
        const minAmplitude = getRandomFloat(-100, maxAmplitude);
        defaultSettings.maxAmplitude = maxAmplitude;
        defaultSettings.minAmplitude = minAmplitude;
        const data = audioBuffer.getChannelData(0);
        data[0], data[1] = maxAmplitude, minAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minAmplitude).toBeCloseTo(minAmplitude);
    });
    test("minAmplitude should be minAmplitudeOfAudioBuffer if its in [-100, 100] and larger than max", () => {
        const maxAmplitude = getRandomFloat(0, 100);
        const minAmplitude = getRandomFloat(maxAmplitude, 100);
        defaultSettings.maxAmplitude = maxAmplitude;
        defaultSettings.minAmplitude = minAmplitude;
        const data = audioBuffer.getChannelData(0);
        data[0], data[1] = maxAmplitude, minAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minAmplitude).toBeCloseTo(as.minAmplitudeOfAudioBuffer);
    });
    test("minAmplitude should be minAmplitudeOfAudioBuffer if default value is out of [-100, 100]", () => {
        const minAmplitude = getRandomFloatOutOf(-100, 100);
        defaultSettings.minAmplitude = minAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.minAmplitude).toBeCloseTo(as.minAmplitudeOfAudioBuffer);
    });
    test("AS_UpdateMinAmplitude event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.minAmplitude = getRandomFloat(-100, 100);
        }, window, EventType.AS_UpdateMinAmplitude);
        expect(detail.value).toBeCloseTo(as.minAmplitude);
    });

    // maxAmplitude
    test("maxAmplitude should be maxAmplitudeOfAudioBuffer if no default value is provided", () => {
        const maxAmplitude = getRandomFloat(0, 100);
        audioBuffer.getChannelData(0)[getRandomInt(0,audioBuffer.length)] = maxAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxAmplitude).toBeCloseTo(as.maxAmplitudeOfAudioBuffer);
    });
    test("maxAmplitude should be default value if its in [-100, 100] and larger than min", () => {
        const maxAmplitude = getRandomFloat(0, 100);
        const minAmplitude = getRandomFloat(-100, maxAmplitude);
        defaultSettings.maxAmplitude = maxAmplitude;
        defaultSettings.minAmplitude = minAmplitude;
        const data = audioBuffer.getChannelData(0);
        data[0], data[1] = maxAmplitude, minAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxAmplitude).toBeCloseTo(maxAmplitude);
    });
    test("maxAmplitude should be maxAmplitudeOfAudiobuffer if its in [-100, 100] and smaller than min", () => {
        const maxAmplitude = getRandomFloat(0, 100);
        const minAmplitude = getRandomFloat(maxAmplitude, 100);
        defaultSettings.maxAmplitude = maxAmplitude;
        defaultSettings.minAmplitude = minAmplitude;
        const data = audioBuffer.getChannelData(0);
        data[0], data[1] = maxAmplitude, minAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxAmplitude).toBeCloseTo(as.maxAmplitudeOfAudioBuffer);
    });
    test("maxAmplitude should be maxAmplitudeOfAudioBuffer if default value is out of [-100, 100]", () => {
        const maxAmplitude = getRandomFloatOutOf(-100, 100);
        defaultSettings.maxAmplitude = maxAmplitude;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.maxAmplitude).toBeCloseTo(as.maxAmplitudeOfAudioBuffer);
    });
    test("AS_UpdateMaxAmplitude event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.maxAmplitude = getRandomFloat(-100, 100);
        }, window, EventType.AS_UpdateMaxAmplitude);
        expect(detail.value).toBeCloseTo(as.maxAmplitude);
    });

    // spectrogramAmplitudeRange
    test("spectrogramAmplitudeRange should be -90 if no default value is provided", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramAmplitudeRange).toBe(-90);
    });
    test("spectrogramAmplitudeRange should be default value if its in [-1000, 0]", () => {
        const spectrogramAmplitudeRange = getRandomFloat(-1000, 0);
        defaultSettings.spectrogramAmplitudeRange = spectrogramAmplitudeRange;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramAmplitudeRange).toBeCloseTo(spectrogramAmplitudeRange);
    });
    test("spectrogramAmplitudeRange should be -90 if default value is out of [-1000, 0]", () => {
        const spectrogramAmplitudeRange = getRandomFloatOutOf(-1000, 0);
        defaultSettings.spectrogramAmplitudeRange = spectrogramAmplitudeRange;
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        expect(as.spectrogramAmplitudeRange).toBe(-90);
    });
    test("AS_UpdateSpectrogramAmplitudeRange event should be sent", async () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
        const detail = await waitEventForAction(() => {
            as.spectrogramAmplitudeRange = getRandomFloat(-1000, 0);
        }, window, EventType.AS_UpdateSpectrogramAmplitudeRange);
        expect(detail.value).toBeCloseTo(as.spectrogramAmplitudeRange);
    });

});

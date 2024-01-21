import { MockAudioBuffer, getRandomFloat, getRandomFloatOutOf, getRandomInt, waitEventForAction } from "../../helper";
import { AnalyzeDefault } from "../../../config";
import AnalyzeSettingsService from "../../../webview/service/analyzeSettingsService";
import { EventType } from "../../../webview/events";

describe("fromDefaultSettings", () => {
    let defaultSettings: AnalyzeDefault;
    let audioBuffer: AudioBuffer;
    beforeEach(() => {
        defaultSettings = new AnalyzeDefault(undefined, undefined, undefined, undefined, undefined, undefined);
        audioBuffer = new MockAudioBuffer(1, 44100, 44100) as unknown as AudioBuffer;
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

describe("updateAnalyzeID", () => {
    test("analyzeID should be updated", () => {
        const as = AnalyzeSettingsService.fromDefaultSetting(
            new AnalyzeDefault(0, 0, 0, 0, 0, 0),
            new MockAudioBuffer(1, 44100, 44100) as unknown as AudioBuffer
        );
        const analyzeID = as.analyzeID;
        as.updateAnalyzeID();
        expect(as.analyzeID).not.toBe(analyzeID);
    });
});


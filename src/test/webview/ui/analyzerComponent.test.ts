import { AnalyzeDefault } from "../../../config";
import { EventType } from "../../../webview/events";
import AnalyzeService from "../../../webview/service/analyzeService";
import AnalyzeSettingsService from "../../../webview/service/analyzeSettingsService";
import AnalyzerComponent from "../../../webview/ui/analyzerComponent";
import { createAudioContext, getRandomFloat, getRandomInt, wait, waitEventForAction } from "../../helper";

describe('analyser', () => {
    let audioBuffer: AudioBuffer;
    let analyzeSettingsService: AnalyzeSettingsService;
    let analyzerComponent: AnalyzerComponent;
    beforeAll(() => {
        document.body.innerHTML = '<div id="analyzer"></div>';
        const audioContext = createAudioContext(44100);
        audioBuffer = audioContext.createBuffer(2, 44100, 44100);
        const analyzeDefault = new AnalyzeDefault(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        const analyzeService = new AnalyzeService(audioBuffer);
        analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(analyzeDefault, audioBuffer);
        analyzerComponent = new AnalyzerComponent("analyzer", audioBuffer, analyzeService, analyzeSettingsService, analyzeDefault, false);
    });

    afterAll(() => {
        analyzerComponent.dispose();
    });

    test('analyzer should have analyze-button', () => {
        expect(document.getElementById('analyze-button')).toBeTruthy();
    });

    test('analyzer should have analyze-setting-button', () => {
        expect(document.getElementById('analyze-setting-button')).toBeTruthy();
    });

    test('analyzer should have analyze-setting', () => {
        expect(document.getElementById('analyze-setting')).toBeTruthy();
    });

    test('display of analyze-setting should be controled by analyze-setting-button', () => {
        const analyzeSetting = document.getElementById('analyze-setting');
        const analyzeSettingButton = document.getElementById('analyze-setting-button');
        // at first, analyze-setting should be hidden
        expect(analyzeSetting?.style.display).toBe('none');
        // control display by clicking analyze-setting-button
        analyzeSettingButton?.dispatchEvent(new Event('click'));
        expect(analyzeSetting?.style.display).toBe('block');
        analyzeSettingButton?.dispatchEvent(new Event('click'));
        expect(analyzeSetting?.style.display).toBe('none');
    });

    test('figures in analyze-result-box should be created after analyze', () => {
        analyzerComponent.analyze();
        const figures = document.getElementById('analyze-result-box')?.querySelectorAll('canvas');
        // figures: waveform+axis and spectrogram+axis for each channels
        expect(figures.length).toBe(audioBuffer.numberOfChannels * 4);
    });

    test('seek-bar on the figures should be created after analyze', () => {
        analyzerComponent.analyze();
        expect(document.querySelector('.seek-div')).toBeTruthy();
        expect(document.querySelector('.input-seek-bar')).toBeTruthy();
    });

    test('window size should be updated when user change window-size-select', () => {
        const index = getRandomInt(0, 7);
        const windowSize = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768][index];
        const windowSizeSelect = <HTMLSelectElement>document.getElementById('analyze-window-size');
        windowSizeSelect.selectedIndex = index;
        windowSizeSelect.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.windowSize).toBe(windowSize);
    });

    test("frequency scale should be updated when user change frequency-scale-select", () => {
        const frequencyScale = getRandomInt(0, 2);
        const frequencyScaleSelect = <HTMLSelectElement>document.getElementById('analyze-frequency-scale');
        frequencyScaleSelect.selectedIndex = frequencyScale;
        frequencyScaleSelect.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.frequencyScale).toBe(frequencyScale);
    });

    test('mel-filter-num should be updated when user change mel-filter-num-input', () => {
        const melFilterNum = getRandomFloat(20, 200);
        const melFilterNumInput = <HTMLInputElement>document.getElementById('analyze-mel-filter-num');
        melFilterNumInput.value = melFilterNum.toString();
        melFilterNumInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.melFilterNum).toBe(Math.trunc(melFilterNum));
    });
    test('mel-filter-num-input should be updated when recieving update-mel-filter-num event', () => {
        const melFilterNum = getRandomFloat(20, 200);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMelFilterNum, {
            detail: {
                value: melFilterNum
            }
        }));
        const melFilterNumInput = <HTMLInputElement>document.getElementById('analyze-mel-filter-num');
        expect(Number(melFilterNumInput.value)).toBe(melFilterNum);        
    });

    test('min-frequency should be updated when user change min-frequency-input', () => {
        const minFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
        const minFrequencyInput = <HTMLInputElement>document.getElementById('analyze-min-frequency');
        minFrequencyInput.value = minFrequency.toString();
        minFrequencyInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.minFrequency).toBeCloseTo(minFrequency);
    });
    test('min-frequency-input should be updated when recieving update-min-frequency event', () => {
        const minFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMinFrequency, {
            detail: {
                value: minFrequency
            }
        }));
        const minFrequencyInput = <HTMLInputElement>document.getElementById('analyze-min-frequency');
        expect(Number(minFrequencyInput.value)).toBeCloseTo(minFrequency);        
    });

    test('max-frequency should be updated when user change max-frequency-input', () => {
        const maxFrequency = getRandomFloat(analyzeSettingsService.minFrequency, audioBuffer.sampleRate / 2);
        const maxFrequencyInput = <HTMLInputElement>document.getElementById('analyze-max-frequency');
        maxFrequencyInput.value = maxFrequency.toString();
        maxFrequencyInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.maxFrequency).toBeCloseTo(maxFrequency);
    });
    test('max-frequency-input should be updated when recieving update-max-frequency event', () => {
        const maxFrequency = getRandomFloat(analyzeSettingsService.minFrequency, audioBuffer.sampleRate / 2);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMaxFrequency, {
            detail: {
                value: maxFrequency
            }
        }));
        const maxFrequencyInput = <HTMLInputElement>document.getElementById('analyze-max-frequency');
        expect(Number(maxFrequencyInput.value)).toBeCloseTo(maxFrequency);        
    });

    test('min-time should be updated when user change min-time-input', () => {
        const minTime = getRandomFloat(0, audioBuffer.duration);
        const minTimeInput = <HTMLInputElement>document.getElementById('analyze-min-time');
        minTimeInput.value = minTime.toString();
        minTimeInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.minTime).toBeCloseTo(minTime);
    });
    test('min-time-input should be updated when recieving update-min-time event', () => {
        const minTime = getRandomFloat(0, audioBuffer.duration);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMinTime, {
            detail: {
                value: minTime
            }
        }));
        const minTimeInput = <HTMLInputElement>document.getElementById('analyze-min-time');
        expect(Number(minTimeInput.value)).toBeCloseTo(minTime);        
    });

    test('max-time should be updated when user change max-time-input', () => {
        const maxTime = getRandomFloat(analyzeSettingsService.minTime, audioBuffer.duration);
        const maxTimeInput = <HTMLInputElement>document.getElementById('analyze-max-time');
        maxTimeInput.value = maxTime.toString();
        maxTimeInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.maxTime).toBeCloseTo(maxTime);
    });
    test('max-time-input should be updated when recieving update-max-time event', () => {
        const maxTime = getRandomFloat(analyzeSettingsService.minTime, audioBuffer.duration);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMaxTime, {
            detail: {
                value: maxTime
            }
        }));
        const maxTimeInput = <HTMLInputElement>document.getElementById('analyze-max-time');
        expect(Number(maxTimeInput.value)).toBeCloseTo(maxTime);        
    });

    test('min-amplitude should be updated when user change min-amplitude-input', () => {
        const minAmplitude = getRandomFloat(-1, 1);
        const minAmplitudeInput = <HTMLInputElement>document.getElementById('analyze-min-amplitude');
        minAmplitudeInput.value = minAmplitude.toString();
        minAmplitudeInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.minAmplitude).toBeCloseTo(minAmplitude);
    });
    test('min-amplitude-input should be updated when recieving update-min-amplitude event', () => {
        const minAmplitude = getRandomFloat(-1, 1);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMinAmplitude, {
            detail: {
                value: minAmplitude
            }
        }));
        const minAmplitudeInput = <HTMLInputElement>document.getElementById('analyze-min-amplitude');
        expect(Number(minAmplitudeInput.value)).toBeCloseTo(minAmplitude);        
    });

    test('max-amplitude should be updated when user change max-amplitude-input', () => {
        const maxAmplitude = getRandomFloat(analyzeSettingsService.minAmplitude, 1);
        const maxAmplitudeInput = <HTMLInputElement>document.getElementById('analyze-max-amplitude');
        maxAmplitudeInput.value = maxAmplitude.toString();
        maxAmplitudeInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.maxAmplitude).toBeCloseTo(maxAmplitude);
    });
    test('max-amplitude-input should be updated when recieving update-max-amplitude event', () => {
        const maxAmplitude = getRandomFloat(analyzeSettingsService.minAmplitude, 1);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateMaxAmplitude, {
            detail: {
                value: maxAmplitude
            }
        }));
        const maxAmplitudeInput = <HTMLInputElement>document.getElementById('analyze-max-amplitude');
        expect(Number(maxAmplitudeInput.value)).toBeCloseTo(maxAmplitude);        
    });

    test('spectrogram-amplitude-range should be updated when user change spectrogram-amplitude-range-input', () => {
        const spectrogramAmplitudeRange = getRandomFloat(-90, 0);
        const spectrogramAmplitudeRangeInput = <HTMLInputElement>document.getElementById('analyze-spectrogram-amplitude-range');
        spectrogramAmplitudeRangeInput.value = spectrogramAmplitudeRange.toString();
        spectrogramAmplitudeRangeInput.dispatchEvent(new Event(EventType.Change));
        expect(analyzeSettingsService.spectrogramAmplitudeRange).toBeCloseTo(spectrogramAmplitudeRange);
    });
    test('spectrogram-amplitude-range-input should be updated when recieving update-spectrogram-amplitude-range event', () => {
        const spectrogramAmplitudeRange = getRandomFloat(-90, 0);
        window.dispatchEvent(new CustomEvent(EventType.AS_UpdateSpectrogramAmplitudeRange, {
            detail: {
                value: spectrogramAmplitudeRange
            }
        }));
        const spectrogramAmplitudeRangeInput = <HTMLInputElement>document.getElementById('analyze-spectrogram-amplitude-range');
        expect(Number(spectrogramAmplitudeRangeInput.value)).toBeCloseTo(spectrogramAmplitudeRange);        
    });

});

describe("auto analyze", () => {
    test('analyzer should start analyze if autoAnalyze is true', () => {
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
        const ad = new AnalyzeDefault(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        const analyzeService = new AnalyzeService(audioBuffer);
        const analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(ad, audioBuffer);
        const ac = new AnalyzerComponent("analyzer", audioBuffer, analyzeService, analyzeSettingsService, ad, true);
        expect(document.getElementById('analyze-result-box')?.querySelectorAll('canvas').length).toBe(8);
        ac.dispose();
    });

    test('analyzer should not start analyze if autoAnalyze is false', () => {
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
        const ad = new AnalyzeDefault(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        const analyzeService = new AnalyzeService(audioBuffer);
        const analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(ad, audioBuffer);
        const ac = new AnalyzerComponent("analyzer", audioBuffer, analyzeService, analyzeSettingsService, ad, false);
        expect(document.getElementById('analyze-result-box')?.querySelectorAll('canvas').length).toBe(0);
        ac.dispose();
    });
});

describe('position of seek-bar should be updated when recieving update-seekbar event', () => {
    let analyzeSettingsService: AnalyzeSettingsService;
    let analyzerComponent: AnalyzerComponent;

    beforeAll(() => {
        document.body.innerHTML = '<div id="analyzer"></div>';
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(2, 441000, 44100);
        const analyzeDefault = new AnalyzeDefault(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        const analyzeService = new AnalyzeService(audioBuffer);
        analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(analyzeDefault, audioBuffer);
        analyzeSettingsService.minTime = 2;
        analyzeSettingsService.maxTime = 6;
        // audio: 10s, minTime: 2s, maxTime: 6s
        analyzerComponent = new AnalyzerComponent("analyzer", audioBuffer, analyzeService, analyzeSettingsService, analyzeDefault, false);
        analyzerComponent.analyze();
    });

    afterAll(() => {
        analyzerComponent.dispose();
    });

    test('value: 50(5s), position: 75%', () => {
        const visibleSeekbar = <HTMLInputElement>document.querySelector(".seek-div");
        window.dispatchEvent(new CustomEvent('update-seekbar', {
            detail: {
                value: 50
            }
        }));
        expect(visibleSeekbar.style.width).toBe('75%');
    });

    test('value: 5(0.5s), position: 0%', () => {
        const visibleSeekbar = <HTMLInputElement>document.querySelector(".seek-div");
        window.dispatchEvent(new CustomEvent('update-seekbar', {
            detail: {
                value: 5
            }
        }));
        expect(visibleSeekbar.style.width).toBe('0%');
    });

    test('value: 90(9s), position: 100%', () => {
        const visibleSeekbar = <HTMLInputElement>document.querySelector(".seek-div");
        window.dispatchEvent(new CustomEvent('update-seekbar', {
            detail: {
                value: 90
            }
        }));
        expect(visibleSeekbar.style.width).toBe('100%');
    });

});

describe('input-seekbar event should be dispatched when user change seek-bar on the figure', () => {
    let analyzeSettingsService: AnalyzeSettingsService;
    let analyzerComponent: AnalyzerComponent;

    beforeAll(async () => {
        document.body.innerHTML = '<div id="analyzer"></div>';
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(2, 441000, 44100);
        const analyzeDefault = new AnalyzeDefault(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        const analyzeService = new AnalyzeService(audioBuffer);
        analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(analyzeDefault, audioBuffer);
        analyzeSettingsService.minTime = 2;
        analyzeSettingsService.maxTime = 6;
        // audio: 10s, minTime: 2s, maxTime: 6s
        analyzerComponent = new AnalyzerComponent("analyzer", audioBuffer, analyzeService, analyzeSettingsService, analyzeDefault, false);
        analyzerComponent.analyze();
    });

    afterAll(() => {
        analyzerComponent.dispose();
    });

    test('value: 0(2s), send-value: 20', async () => {
        const detail = await waitEventForAction(() => {
            const inputSeekbar = <HTMLInputElement>document.querySelector(".input-seek-bar");
            inputSeekbar.value = "0";
            inputSeekbar.dispatchEvent(new Event(EventType.Change));
        }, window, EventType.InputSeekbar);
        expect(detail.value).toBe(20);
    });

    test('value: 25(3s), send-value: 30', async () => {
        const detail = await waitEventForAction(() => {
            const inputSeekbar = <HTMLInputElement>document.querySelector(".input-seek-bar");
            inputSeekbar.value = "25";
            inputSeekbar.dispatchEvent(new Event(EventType.Change));
        }, window, EventType.InputSeekbar);
        expect(detail.value).toBe(30);
    });

    test('value: 100(6s), send-value: 60', async () => {
        const detail = await waitEventForAction(() => {
            const inputSeekbar = <HTMLInputElement>document.querySelector(".input-seek-bar");
            inputSeekbar.value = "100";
            inputSeekbar.dispatchEvent(new Event(EventType.Change));
        }, window, EventType.InputSeekbar);
        expect(detail.value).toBe(60);
    });

});

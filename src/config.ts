export interface Config {
    autoPlay: boolean,
    autoAnalyze: boolean,
    analyzeDefault: AnalyzeDefault,
}

export class AnalyzeDefault {
    windowSizeIndex: number;
    minAmplitude: number;
    maxAmplitude: number;
    minFrequency: number;
    maxFrequency: number;
    spectrogramAmplitudeRange: number;

    constructor(windowSizeIndex: number, minAmplitude: number, maxAmplitude: number, minFrequency: number, maxFrequency: number, spectrogramAmplitudeRange: number) {
        this.windowSizeIndex = windowSizeIndex;
        if (!Number.isInteger(windowSizeIndex) || windowSizeIndex < 0 || 8 < windowSizeIndex) {
            this.windowSizeIndex = 2; // 2:1024
        }

        this.minAmplitude = minAmplitude;
        this.maxAmplitude = maxAmplitude;
        this.minFrequency = minFrequency;
        this.maxFrequency = maxFrequency;
        this.spectrogramAmplitudeRange = spectrogramAmplitudeRange;
    }
}

export interface AnalyzeSettingsProps {
    windowSize: number;
    hopSize: number;
    minFrequency: number;
    maxFrequency: number;
    minTime: number;
    maxTime: number;
    minAmplitude: number;
    maxAmplitude: number;
    spectrogramAmplitudeRange: number;
    analyzeID: string;
}

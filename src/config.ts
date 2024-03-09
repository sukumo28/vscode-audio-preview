export interface Config {
    autoPlay: boolean,
    autoAnalyze: boolean,
    analyzeDefault: AnalyzeDefault,
}

export interface AnalyzeDefault {
    windowSizeIndex: number;
    minAmplitude: number;
    maxAmplitude: number;
    minFrequency: number;
    maxFrequency: number;
    spectrogramAmplitudeRange: number;
    frequencyScale: number;
    melFilterNum: number;
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
    frequencyScale: number;
    melFilterNum: number;
}

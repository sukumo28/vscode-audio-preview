export interface Config {
    autoAnalyze: boolean,
    analyzeDefault: AnalyzeDefault,
}

export interface AnalyzeDefault {
    waveformVisible: boolean;
    waveformVerticalScale: number,
    spectrogramVisible: boolean;
    spectrogramVerticalScale: number,
    roundWaveformAxis: boolean;
    roundTimeAxis: boolean;
    windowSizeIndex: number;
    minAmplitude: number;
    maxAmplitude: number;
    minFrequency: number;
    maxFrequency: number;
    spectrogramAmplitudeRange: number;
    frequencyScale: number;
    melFilterNum: number;
}

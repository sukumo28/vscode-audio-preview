export interface Config {
    autoAnalyze: boolean,
    analyzeDefault: AnalyzeDefault,
}

export interface AnalyzeDefault {
    waveformVisible: boolean;
    waveformVerticalScale: number,
    waveformShowChannelLabel: boolean,
    spectrogramVisible: boolean;
    spectrogramVerticalScale: number,
    spectrogramShowChannelLabel: boolean,
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

export interface Config {
    autoPlay: boolean;
    autoAnalyze: boolean;
    analyzeConfigDefault: AnalyzeConfigDefault;
}

export interface AnalyzeConfigDefault {
    windowSizeIndex: number,
    minAmplitude: number,
    maxAmplitude: number,
    minFrequency: number,
    maxFrequency: number,
    spectrogramAmplitudeRange: number,
}

export interface AnalyzeConfig {
    windowSize: number,
    hopSize: number,
    minFrequency: number,
    maxFrequency: number,
    minTime: number,
    maxTime: number,
    minAmplitude: number,
    maxAmplitude: number,
    spectrogramAmplitudeRange: number,
    analyzeID: number
}

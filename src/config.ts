export interface Config {
    autoAnalyze: boolean,
    playerDefault: PlayerDefault,
    analyzeDefault: AnalyzeDefault,
}

export interface PlayerDefault {
    volumeUnitDb: boolean;
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

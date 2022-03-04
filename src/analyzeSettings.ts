export interface AnalyzeDefault {
    windowSizeIndex: number,
    minAmplitude: number,
    maxAmplitude: number,
    minFrequency: number,
    maxFrequency: number,
    spectrogramAmplitudeRange: number,
}

export interface AnalyzeSettings {
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

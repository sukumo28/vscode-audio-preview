export interface Config {
  autoAnalyze: boolean;
  playerDefault: PlayerDefault;
  analyzeDefault: AnalyzeDefault;
}

export interface PlayerDefault {
  volumeUnitDb: boolean;
  initialVolumeDb: number;
  initialVolume: number;
  enableSpacekeyPlay: boolean;
  enableSeekToPlay: boolean;
}

export interface AnalyzeDefault {
  waveformVisible: boolean;
  waveformVerticalScale: number;
  spectrogramVisible: boolean;
  spectrogramVerticalScale: number;
  windowSizeIndex: number;
  minAmplitude: number;
  maxAmplitude: number;
  minFrequency: number;
  maxFrequency: number;
  spectrogramAmplitudeRange: number;
  frequencyScale: number;
  melFilterNum: number;
}

export interface Config {
  autoAnalyze: boolean;
  playerDefault: PlayerDefault;
  analyzeDefault: AnalyzeDefault;
}

export interface PlayerDefault {
  /*
    Choose the scale of the volume bar
    true: dB scale, false: linear scale
    default: false
  */
  volumeUnitDb: boolean;

  /*
    Initial player volume in dB scale. [-80.0, 0.0]
    This setting is valid when volumeUnitDb is true.
    default: 0.0
  */
  initialVolumeDb: number;

  /*
    Initial player volume in linear scale. [0, 100]
    This setting is valid when volumeUnitDb is false.
    default: 100
  */
  initialVolume: number;

  // When set to true, you can play the audio with the space key
  enableSpacekeyPlay: boolean;

  /*
    Choose whether the audio will automatically play when you seek a new position.
    true: plays on seeking
    false: does not start playing on seeking, but resume playing from input time when audio is already playing
    default: true
  */
  enableSeekToPlay: boolean;

  /*
    Enable high-pass filter on playback.
    true: enable high-pass filter, false: disable high-pass filter
    default: false
  */
  enableHpf: boolean;

  /*
    Cut off frequency for the high-pass filter in Hz. [10, sampleRate/2]
    default: 100
  */
  hpfFrequency: number;

  /*
    Enable low-pass filter on playback.
    true: enable low-pass filter, false: disable low-pass filter
    default: false
  */
  enableLpf: boolean;

  /*
    Cut off frequency for the low-pass filter in Hz. [10, sampleRate/2]
    default: 100
  */
  lpfFrequency: number;

  /*
    Match the filter frequencies to the frequency range of the analyzer.
    Note that if this option is set to true, hpfFrequency and lpfFrequency is overridden by spectrogram frequency range settings.
    true: automatically match the filter frequencies to the analyzer's frequency range
    false: filter frequencies can be set independently of the analyzer's frequency range
    default: false
  */
  matchFilterFrequencyToSpectrogram: boolean;
}

export interface AnalyzeDefault {
  // Settings about WaveForm

  /*
    Make the waveform visible or hidden.
    true: visible, false: hidden
    default: true
  */
  waveformVisible: boolean;

  /*
    Adjust height of the waveform.
    The valid range of [0.2, 2.0] scales the default height.
    default: 1.0
    This option can only be configured through the settings file.
  */
  waveformVerticalScale: number;

  /*
    Range of amplitude displayed on the figure. [-100,100]
    Default value is automatically expanded to fit min and max value of audio data.
  */
  // default: min amplitude of audio data
  minAmplitude: number;
  // default: max amplitude of audio data
  maxAmplitude: number;

  // Settings about Spectrogram

  /*
    Make the spectrogram visible or hidden.
    true: visible, false: hidden
    default: true
  */
  spectrogramVisible: boolean;

  /*
    The valid range of [0.2, 2.0] scales the default height.
    default: 1.0
    This option can only be configured through the settings file.
  */
  spectrogramVerticalScale: number;

  /*
    FFT window sizw. [0,7]
    You can choose from values below.
    0:256, 1:512, 2:1024, 3:2048, 4:4096, 5:8192, 6:16384, 7:32768
    default: 2
  */
  windowSizeIndex: number;

  // Range of frequency displayed on the figure. [0,sampleRate/2]
  // default: 0
  minFrequency: number;
  // default: sampleRate/2
  maxFrequency: number;

  /*
    Range of amplitude(dB) displayed on the spectrogram. [-1000, 0]
    Since the maximum value of Amplitude is adjusted to be 0 dB, set a negative value.
    default: -90
  */
  spectrogramAmplitudeRange: number;

  /*
    Frequency Scale of spectrogram. [0,2]
    You can choose from values below.
    0:Linear, 1:Log, 2:Mel
    default: 0
  */
  frequencyScale: number;

  // Number of filter in melFilterBank. [20, 200]
  // default: 40
  melFilterNum: number;
}

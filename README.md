# audio-preview

You can play your audio file and preview its info on VS Code.  
You can also check waveform and spectrogram.

Supported Audio Files: `wav`, `mp3`, `aac`, `ogg`, `flac`, `opus`, `m4a`, `sph` ... etc.

Available on Marketplace: https://marketplace.visualstudio.com/items?itemName=sukumo28.wav-preview

> **Note**  
> Please consider using the built-in audio playback feature as well.
> When we developed this VS Code extension, VS Code did not bundle ffmpeg and had no audio playback capabilities.
> However, with updates, a built-in audio playback feature has been added.
> While this extension has finish its purpose, we will continue to maintain it slowly.

## Features

How to preview audio.  
![how-to-use](https://github.com/sukumo28/vscode-audio-preview/blob/main/images/how-to-use.gif?raw=true)

- If you want to display only a specific range of graphs, dragging on the graph will re-run analyze on the selected range.

  - By pressing the Ctrl key when dragging, you can select only the time range.
  - By pressing the Shift key when dragging, you can select only the value range.

- If you want to return to the original range, right-click on the graph.

  - Pressing the Ctrl key when right-clicking, reset only the time range.
  - Pressing the Shift key when right-clicking, reset only the value range.

- If you want to specify the numerical values in detail, you can set the values in the analyze tab found in the settings tab.

If this extension does not open by default, edit `settings.json` like below.

```jsonc
"workbench.editorAssociations": {
    "*.wav": "wavPreview.audioPreview",
    "*.mp3": "wavPreview.audioPreview",
    ...
},
```

## Settings

You can configure these options in `settings.json` or VS Code's GUI.  
Configuration is completely optional.  
There is no need to configure anything if you are just using this extension.

You can analyze audio automatically when you open it.

```jsonc
"WavPreview.autoAnalyze": true
```

You can configure default value of player settings like example below.

```jsonc
"WavPreview.playerDefault": {
    /*
    Choose the scale of the volume bar
    true: dB scale, false: linear scale
    default: false
    */
    "volumeUnitDb": false,

    /*
    Initial player volume in dB scale. [-80.0, 0.0]
    This setting is valid when volumeUnitDb is true.
    default: 0.0
    */
    "initialVolumeDb": 0.0,

    /*
    Initial player volume in linear scale. [0, 100]
    This setting is valid when volumeUnitDb is false.
    default: 100
    */
    "initialVolume": 100,

    // When set to true, you can play the audio with the space key
    "enableSpacekeyPlay": true,

    /*
    Choose whether the audio will automatically play when you seek a new position.
    true: plays on seeking
    false: does not start playing on seeking, but resume playing from input time when audio is already playing
    default: true
    */
    "enableSeekToPlay": true,

    /*
    Enable high-pass filter on playback.
    true: enable high-pass filter, false: disable high-pass filter
    default: false
    */
    "enableHpf": true,

    /*
    Cut off frequency for the high-pass filter in Hz. [10, sampleRate/2]
    default: 100
    */
    "hpfFrequency": 100,

    /*
    Enable low-pass filter on playback.
    true: enable low-pass filter, false: disable low-pass filter
    default: false
    */
    "enableLpf": true,

    /*
    Cut off frequency for the low-pass filter in Hz. [10, sampleRate/2]
    default: 100
    */
    "lpfFrequency": 10000,

    /*
    Match the filter frequencies to the frequency range of the analyzer.
    Note that if this option is set to true, hpfFrequency and lpfFrequency is overridden by spectrogram frequency range settings.
    true: automatically match the filter frequencies to the analyzer's frequency range
    false: filter frequencies can be set independently of the analyzer's frequency range
    default: false
    */
    "matchFilterFrequencyToSpectrogram": true,
}
```

You can configure default value of analyze settings like example below.

```jsonc
"WavPreview.analyzeDefault": {
    // Settings about WaveForm

    /*
    Make the waveform visible or hidden.
    true: visible, false: hidden
    default: true
    */
    "waveformVisible": true,

    /*
    Adjust height of the waveform.
    The valid range of [0.2, 2.0] scales the default height.
    default: 1.0
    This option can only be configured through the settings file.
    */
    "waveformVerticalScale": 1.0,

    /*
    Range of amplitude displayed on the figure. [-100,100]
    Default value is automatically expanded to fit min and max value of audio data.
    */
    // default: min amplitude of audio data
    "minAmplitude": -1,
    // default: max amplitude of audio data
    "maxAmplitude": 1,

    // Settings about Spectrogram

    /*
    Make the spectrogram visible or hidden.
    true: visible, false: hidden
    default: true
    */
    "spectrogramVisible": true,

    /*
    The valid range of [0.2, 2.0] scales the default height.
    default: 1.0
    This option can only be configured through the settings file.
    */
    "spectrogramVerticalScale": 1.0,

    /*
    FFT window sizw. [0,7]
    You can choose from values below.
    0:256, 1:512, 2:1024, 3:2048, 4:4096, 5:8192, 6:16384, 7:32768
    default: 2
    */
    "windowSizeIndex": 5,

    // Range of frequency displayed on the figure. [0,sampleRate/2]
    // default: 0
    "minFrequency": 1000,
    // default: sampleRate/2
    "maxFrequency": 8000,

    /*
    Range of amplitude(dB) displayed on the spectrogram. [-1000, 0]
    Since the maximum value of Amplitude is adjusted to be 0 dB, set a negative value.
    default: -90
    */
    "spectrogramAmplitudeRange": -100,

    /*
    Frequency Scale of spectrogram. [0,2]
    You can choose from values below.
    0:Linear, 1:Log, 2:Mel
    default: 0
    */
    "frequencyScale": 1,

    // Number of filter in melFilterBank. [20, 200]
    // default: 40
    "melFilterNum": 100
}
```

## Development

### Contributions

Feel free to report Isuues and send Pull Requests on github.

If an error occurs and you create an issue, posting the log displayed in VSCode's DevTools to the issue may be useful for development and fix.  
VSCode's DevTools can be opened in the following ways.

- Press f12
- Press shift + ctrl + I
- Select Help > Toggle Developer Tools from the menu at the top of the screen

### Build

- Clone this repo
- Install Dependencies: `npm install`
- Build Container for decoder: `docker build -t audio-decoder ./src/decoder/`
- Compile decoder.cpp to wasm: `docker run --rm -v ${pwd}/src/decoder:/build -it audio-decoder make`
- Run Extension: f5

### Test

`npm run test`  
This command runs the tests in `src` directory.

### Lint, Format

Linter  
`npm run lint`

Formatter  
`npm run format`  
This is automatically applied upon saving due to the settings in the .vscode/settings.json of this project, so there is generally no need to run it manually.

### References

Custom Editor: https://code.visualstudio.com/api/extension-guides/custom-editors  
Custom Editor Example: https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample

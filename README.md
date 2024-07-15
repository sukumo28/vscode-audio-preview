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

You can set the default values for the settings displayed in the settings tab as shown below.  
To check all items, please refer to [here](https://github.com/sukumo28/vscode-audio-preview/blob/main/src/config.ts).

```jsonc
"WavPreview.playerDefault": {
  "initialVolume": 50
}
```

```jsonc
"WavPreview.analyzeDefault": {
  "spectrogramVisible": false
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

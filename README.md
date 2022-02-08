# wav-preview 

You can play your wav file and preview its info on VS Code with this extension.  
You can also check waveform and spectrogram.  

## Features

How to preview wav.  
![how-to-use](https://github.com/sukumo28/wav-preview/blob/main/images/how-to-use.gif?raw=true)  
Note: You can play audio without waiting for finish decoding.

If this extension is not open by default, please follow movie below.
![how-to-set-default](https://github.com/sukumo28/wav-preview/blob/main/images/how-to-set-default.gif?raw=true)  

## Settings  
You can configure these options in `settings.json` or VS Code's GUI.  

You can play audio automatically when you open it.  
```json
"WavPreview.autoPlay": true
```

You can analyze audio automatically when you open it.   
```json
"WavPreview.autoAnalyze": true
```

You can configure default value of analyze settings like below.  
```json
"WavPreview.analyzeDefault": {
        // fft window sizw. [0,7]
        // 0:256, 1:512, 2:1024, 3:2048, 4:4096, 5:8192, 6:16384, 7:32768
        "windowSizeIndex": 5,

        // range of amplitude displayed on the figure [-100,100]
        "minAmplitude": -1,
        "maxAmplitude": 1,

        // range of frequency displayed on the figure [0,sampleRate/2]
        "minFrequency": 1000,
        "maxFrequency": 8000,
    }
}
```
  
## Known Issues

Feel free to report isuues on github.  

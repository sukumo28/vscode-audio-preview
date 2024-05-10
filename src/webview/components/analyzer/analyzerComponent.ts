import "./analyzerComponent.css";
import { EventType } from "../../events";
import Component from "../../component";
import PlayerService from "../../services/playerService";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService, {
  AnalyzeSettingsProps,
} from "../../services/analyzeSettingsService";
import WaveFormComponent from "../waveform/waveFormComponent";
import SpectrogramComponent from "../spectrogram/spectrogramComponent";

export default class AnalyzerComponent extends Component {
  private _componentRootSelector: string;
  private _componentRoot: HTMLElement;

  private _audioBuffer: AudioBuffer;
  private _analyzeService: AnalyzeService;
  private _analyzeSettingsService: AnalyzeSettingsService;
  private _playerService: PlayerService;

  private _analyzeButton: HTMLButtonElement;
  private _analyzeSettingButton: HTMLButtonElement;
  private _analyzeResultBox: HTMLElement;

  constructor(
    componentRootSelector: string,
    audioBuffer: AudioBuffer,
    analyzeService: AnalyzeService,
    analyzeSettingsService: AnalyzeSettingsService,
    playerService: PlayerService,
    autoAnalyze: boolean
  ) {
    super();
    this._audioBuffer = audioBuffer;
    this._analyzeService = analyzeService;
    this._analyzeSettingsService = analyzeSettingsService;
    this._playerService = playerService;

    // init base html
    this._componentRootSelector = componentRootSelector;
    this._componentRoot = document.querySelector(this._componentRootSelector);
    this._componentRoot.innerHTML = `
      <div class="analyzerComponent">
        <div class="analyzeControllerButtons">
            <div>analyze</div>
            <button class="analyzeButton">analyze</button>
            <button class="analyzeSettingButton">▼settings</button>
        </div>
        <div class="analyzeSetting">
            <h3>Common Settings</h3>
            <div>
                time range:
                <input class="analyzeSetting__input js-analyzeSetting-minTime" type="number" step="0.1">s ~
                <input class="analyzeSetting__input js-analyzeSetting-maxTime" type="number" step="0.1">s
            </div>

            <h3>WaveForm Settings</h3>
            <div>
                <input class="js-analyzeSetting-waveformVisible" type="checkbox">visible
            </div>
            <div>
                waveform amplitude range:
                <input class="analyzeSetting__input js-analyzeSetting-minAmplitude" type="number" step="0.1"> ~
                <input class="analyzeSetting__input js-analyzeSetting-maxAmplitude" type="number" step="0.1">
            </div>

            <h3>Spectrogram Settings</h3>
            <div>
                <input class="js-analyzeSetting-spectrogramVisible" type="checkbox">visible
            </div>
            <div>
                window size:
                <select class="analyzeSetting__select js-analyzeSetting-windowSize">
                    <option value="0">256</option>
                    <option value="1">512</option>
                    <option value="2">1024</option>
                    <option value="3">2048</option>
                    <option value="4">4096</option>
                    <option value="5">8192</option>
                    <option value="6">16384</option>
                    <option value="7">32768</option>
                </select>
            </div>
            <div>
                frequency scale:
                <select class="analyzeSetting__select js-analyzeSetting-frequencyScale">
                    <option value="0">Linear</option>
                    <option value="1">Log</option>
                    <option value="2">Mel</option>
                </select>
                mel filter num:
                <input class="analyzeSetting__input js-analyzeSetting-melFilterNum" type="number" step="10">
            </div>
            <div>
                frequency range:
                <input class="analyzeSetting__input js-analyzeSetting-minFrequency" type="number" step="1000">Hz ~
                <input class="analyzeSetting__input js-analyzeSetting-maxFrequency" type="number" step="1000">Hz
            </div>
            <div>
                <div>
                    spectrogram amplitude range:
                    <input class="analyzeSetting__input js-analyzeSetting-spectrogramAmplitudeRange" type="number" step="10">dB ~ 0 dB
                </div>
                <div>
                    color:
                    <canvas class="analyzeSetting__canvas js-analyzeSetting-spectrogramColorAxis" width="800px" height="40px"></canvas>
                    <canvas class="analyzeSetting__canvas js-analyzeSetting-spectrogramColor" width="100px" height="5px"></canvas>
                </div>
            </div>
        </div>
        <div class="analyzeResultBox"></div>
      </div>
    `;

    // init analyze setting menu
    const analyzeSettingElement = this._componentRoot.querySelector(
      ".analyzeSetting"
    ) as HTMLElement;
    analyzeSettingElement.style.display = "none";
    this._analyzeSettingButton = <HTMLButtonElement>(
      this._componentRoot.querySelector(".analyzeSettingButton")
    );
    this._analyzeSettingButton.onclick = () => {
      const settings = this._componentRoot.querySelector(
        ".analyzeSetting"
      ) as HTMLElement;
      if (settings.style.display !== "block") {
        settings.style.display = "block";
        this._analyzeSettingButton.textContent = "▲settings";
      } else {
        settings.style.display = "none";
        this._analyzeSettingButton.textContent = "▼settings";
      }
    };
    this.initAnalyzerSetting();

    // init analyze button
    this._analyzeButton = <HTMLButtonElement>(
      this._componentRoot.querySelector(".analyzeButton")
    );
    this._analyzeButton.onclick = () => {
      this.analyze();
    };

    // init analyze result box
    this._analyzeResultBox =
      this._componentRoot.querySelector(".analyzeResultBox");

    // analyze if user set autoAnalyze true
    if (autoAnalyze) {
      this.analyze();
    }
  }

  private initAnalyzerSetting() {
    const settings = this._analyzeSettingsService;

    // init waveform visible checkbox
    const waveformVisible = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-waveformVisible")
    );
    waveformVisible.checked = settings.waveformVisible;
    this._addEventlistener(waveformVisible, EventType.CHANGE, () => {
      settings.waveformVisible = waveformVisible.checked;
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_WAVEFORM_VISIBLE,
      (e: CustomEventInit) => {
        waveformVisible.checked = e.detail.value;
      }
    );

    // init spectrogram visible checkbox
    const spectrogramVisible = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-spectrogramVisible")
    );
    spectrogramVisible.checked = settings.spectrogramVisible;
    this._addEventlistener(spectrogramVisible, EventType.CHANGE, () => {
      settings.spectrogramVisible = spectrogramVisible.checked;
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_SPECTROGRAM_VISIBLE,
      (e: CustomEventInit) => {
        spectrogramVisible.checked = e.detail.value;
      }
    );

    // init fft window size index select
    const windowSizeSelect = <HTMLSelectElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-windowSize")
    );
    windowSizeSelect.selectedIndex = settings.windowSizeIndex;
    this._addEventlistener(windowSizeSelect, EventType.CHANGE, () => {
      settings.windowSizeIndex = Number(windowSizeSelect.selectedIndex);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_WINDOW_SIZE_INDEX,
      (e: CustomEventInit) => {
        windowSizeSelect.selectedIndex = e.detail.value;
      }
    );

    // init frequency scale select
    const frequencyScaleSelect = <HTMLSelectElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-frequencyScale")
    );
    frequencyScaleSelect.selectedIndex = settings.frequencyScale;
    this._addEventlistener(frequencyScaleSelect, EventType.CHANGE, () => {
      settings.frequencyScale = Number(frequencyScaleSelect.selectedIndex);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_FREQUENCY_SCALE,
      (e: CustomEventInit) => {
        frequencyScaleSelect.selectedIndex = e.detail.value;
      }
    );

    // init mel filter num input
    const melFilterNumInput = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-melFilterNum")
    );
    melFilterNumInput.value = `${settings.melFilterNum}`;
    this._addEventlistener(melFilterNumInput, EventType.CHANGE, () => {
      settings.melFilterNum = Number(melFilterNumInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_MEL_FILTER_NUM,
      (e: CustomEventInit) => {
        melFilterNumInput.value = `${e.detail.value}`;
      }
    );

    // init frequency range input
    const minFreqInput = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-minFrequency")
    );
    minFreqInput.value = `${settings.minFrequency}`;
    this._addEventlistener(minFreqInput, EventType.CHANGE, () => {
      settings.minFrequency = Number(minFreqInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_MIN_FREQUENCY,
      (e: CustomEventInit) => {
        minFreqInput.value = `${e.detail.value}`;
      }
    );

    const maxFreqInput = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-maxFrequency")
    );
    maxFreqInput.value = `${settings.maxFrequency}`;
    this._addEventlistener(maxFreqInput, EventType.CHANGE, () => {
      settings.maxFrequency = Number(maxFreqInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_MAX_FREQUENCY,
      (e: CustomEventInit) => {
        maxFreqInput.value = `${e.detail.value}`;
      }
    );

    // init time range input
    const minTimeInput = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-minTime")
    );
    minTimeInput.value = `${settings.minTime}`;
    this._addEventlistener(minTimeInput, EventType.CHANGE, () => {
      settings.minTime = Number(minTimeInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_MIN_TIME,
      (e: CustomEventInit) => {
        minTimeInput.value = `${e.detail.value}`;
      }
    );

    const maxTimeInput = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-maxTime")
    );
    maxTimeInput.value = `${settings.maxTime}`;
    this._addEventlistener(maxTimeInput, EventType.CHANGE, () => {
      settings.maxTime = Number(maxTimeInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_MAX_TIME,
      (e: CustomEventInit) => {
        maxTimeInput.value = `${e.detail.value}`;
      }
    );

    // init amplitude range input
    const minAmplitudeInput = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-minAmplitude")
    );
    minAmplitudeInput.value = `${settings.minAmplitude}`;
    this._addEventlistener(minAmplitudeInput, EventType.CHANGE, () => {
      settings.minAmplitude = Number(minAmplitudeInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_MIN_AMPLITUDE,
      (e: CustomEventInit) => {
        minAmplitudeInput.value = `${e.detail.value}`;
      }
    );

    const maxAmplitudeInput = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-maxAmplitude")
    );
    maxAmplitudeInput.value = `${settings.maxAmplitude}`;
    this._addEventlistener(maxAmplitudeInput, EventType.CHANGE, () => {
      settings.maxAmplitude = Number(maxAmplitudeInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_MAX_AMPLITUDE,
      (e: CustomEventInit) => {
        maxAmplitudeInput.value = `${e.detail.value}`;
      }
    );

    // init spectrogram amplitude range input
    const spectrogramAmplitudeRangeInput = <HTMLInputElement>(
      this._componentRoot.querySelector(
        ".js-analyzeSetting-spectrogramAmplitudeRange"
      )
    );
    spectrogramAmplitudeRangeInput.value = `${settings.spectrogramAmplitudeRange}`;
    this.updateColorBar(settings);
    this._addEventlistener(
      spectrogramAmplitudeRangeInput,
      EventType.CHANGE,
      () => {
        settings.spectrogramAmplitudeRange = Number(
          spectrogramAmplitudeRangeInput.value
        );
      }
    );
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_SPECTROGRAM_AMPLITUDE_RANGE,
      (e: CustomEventInit) => {
        spectrogramAmplitudeRangeInput.value = `${e.detail.value}`;
        this.updateColorBar(settings);
      }
    );
  }

  private updateColorBar(settings: AnalyzeSettingsProps) {
    // init color bar
    const colorCanvas = <HTMLCanvasElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-spectrogramColor")
    );
    const colorAxisCanvas = <HTMLCanvasElement>(
      this._componentRoot.querySelector(
        ".js-analyzeSetting-spectrogramColorAxis"
      )
    );
    const colorContext = colorCanvas.getContext("2d", { alpha: false });
    const colorAxisContext = colorAxisCanvas.getContext("2d", { alpha: false });
    // clear axis label
    colorAxisContext.clearRect(
      0,
      0,
      colorAxisCanvas.width,
      colorAxisCanvas.height
    );
    // draw axis label
    colorAxisContext.font = `15px Arial`;
    colorAxisContext.fillStyle = "white";
    for (let i = 0; i < 10; i++) {
      const amp = (i * settings.spectrogramAmplitudeRange) / 10;
      const x = (i * colorAxisCanvas.width) / 10;
      colorAxisContext.fillText(`${amp} dB`, x, colorAxisCanvas.height);
    }
    // draw color
    for (let i = 0; i < 100; i++) {
      const amp = (i * settings.spectrogramAmplitudeRange) / 100;
      const x = (i * colorCanvas.width) / 100;
      colorContext.fillStyle = this._analyzeService.getSpectrogramColor(
        amp,
        settings.spectrogramAmplitudeRange
      );
      colorContext.fillRect(x, 0, colorCanvas.width / 100, colorCanvas.height);
    }
  }

  private clearAnalyzeResult() {
    for (const c of Array.from(this._analyzeResultBox.children)) {
      this._analyzeResultBox.removeChild(c);
    }
  }

  public analyze() {
    // disable analyze button
    this._analyzeButton.style.display = "none";
    // clear previous result
    this.clearAnalyzeResult();

    const settings = this._analyzeSettingsService.toProps();
    console.log("analyze", settings);

    for (let ch = 0; ch < this._audioBuffer.numberOfChannels; ch++) {
      if (this._analyzeSettingsService.waveformVisible) {
        new WaveFormComponent(
          `${this._componentRootSelector} .analyzeResultBox`,
          AnalyzeSettingsService.WAVEFORM_CANVAS_WIDTH,
          AnalyzeSettingsService.WAVEFORM_CANVAS_HEIGHT *
            this._analyzeSettingsService.waveformVerticalScale,
          settings,
          this._audioBuffer.sampleRate,
          this._audioBuffer.getChannelData(ch),
          ch,
          this._audioBuffer.numberOfChannels
        );
      }

      if (this._analyzeSettingsService.spectrogramVisible) {
        new SpectrogramComponent(
          `${this._componentRootSelector} .analyzeResultBox`,
          AnalyzeSettingsService.SPECTROGRAM_CANVAS_WIDTH,
          AnalyzeSettingsService.SPECTROGRAM_CANVAS_HEIGHT *
            this._analyzeSettingsService.spectrogramVerticalScale,
          this._analyzeService,
          settings,
          this._audioBuffer.sampleRate,
          ch,
          this._audioBuffer.numberOfChannels
        );
      }
    }

    // register seekbar on figures
    const visibleBar = document.createElement("div");
    visibleBar.className = "seekDiv";
    this._analyzeResultBox.appendChild(visibleBar);

    const inputSeekbar = document.createElement("input");
    inputSeekbar.type = "range";
    inputSeekbar.className = "inputSeekBar";
    inputSeekbar.step = "0.00001";
    this._analyzeResultBox.appendChild(inputSeekbar);

    this._addEventlistener(
      this._playerService,
      EventType.UPDATE_SEEKBAR,
      (e: CustomEventInit) => {
        const percentInFullRange = e.detail.value;
        const sec = (percentInFullRange * this._audioBuffer.duration) / 100;
        const percentInFigureRange =
          ((sec - settings.minTime) / (settings.maxTime - settings.minTime)) *
          100;
        if (percentInFigureRange < 0) {
          visibleBar.style.width = `0%`;
          return;
        }
        if (100 < percentInFigureRange) {
          visibleBar.style.width = `100%`;
          return;
        }
        visibleBar.style.width = `${percentInFigureRange}%`;
      }
    );
    this._addEventlistener(inputSeekbar, EventType.CHANGE, () => {
      const percentInFigureRange = Number(inputSeekbar.value);
      const sec =
        (percentInFigureRange / 100) * (settings.maxTime - settings.minTime) +
        settings.minTime;
      const percentInFullRange = (sec / this._audioBuffer.duration) * 100;
      this._playerService.onSeekbarInput(percentInFullRange);
      inputSeekbar.value = "100";
    });

    // enable analyze button
    this._analyzeButton.style.display = "block";
  }
}

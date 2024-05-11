import "./analyzeSettingsComponent.css";
import Component from "../../component";
import { EventType } from "../../events";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService, {
  AnalyzeSettingsProps,
} from "../../services/analyzeSettingsService";

export default class AnalyzeSettingsComponent extends Component {
  private _componentRoot: HTMLElement;
  private _analyzeService: AnalyzeService;
  private _analyzeSettingsService: AnalyzeSettingsService;

  constructor(
    componentRootSelector: string,
    analyzeService: AnalyzeService,
    analyzeSettingsService: AnalyzeSettingsService,
  ) {
    super();
    this._componentRoot = document.querySelector(componentRootSelector);
    this._analyzeService = analyzeService;
    this._analyzeSettingsService = analyzeSettingsService;

    this._componentRoot.innerHTML = `
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
    `;

    this.initAnalyzerSettingUI();
  }

  private initAnalyzerSettingUI() {
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
    );

    // init spectrogram amplitude range input
    const spectrogramAmplitudeRangeInput = <HTMLInputElement>(
      this._componentRoot.querySelector(
        ".js-analyzeSetting-spectrogramAmplitudeRange",
      )
    );
    spectrogramAmplitudeRangeInput.value = `${settings.spectrogramAmplitudeRange}`;
    this.updateColorBar(settings);
    this._addEventlistener(
      spectrogramAmplitudeRangeInput,
      EventType.CHANGE,
      () => {
        settings.spectrogramAmplitudeRange = Number(
          spectrogramAmplitudeRangeInput.value,
        );
      },
    );
    this._addEventlistener(
      settings,
      EventType.AS_UPDATE_SPECTROGRAM_AMPLITUDE_RANGE,
      (e: CustomEventInit) => {
        spectrogramAmplitudeRangeInput.value = `${e.detail.value}`;
        this.updateColorBar(settings);
      },
    );
  }

  private updateColorBar(settings: AnalyzeSettingsProps) {
    // init color bar
    const colorCanvas = <HTMLCanvasElement>(
      this._componentRoot.querySelector(".js-analyzeSetting-spectrogramColor")
    );
    const colorAxisCanvas = <HTMLCanvasElement>(
      this._componentRoot.querySelector(
        ".js-analyzeSetting-spectrogramColorAxis",
      )
    );
    const colorContext = colorCanvas.getContext("2d", { alpha: false });
    const colorAxisContext = colorAxisCanvas.getContext("2d", { alpha: false });
    // clear axis label
    colorAxisContext.clearRect(
      0,
      0,
      colorAxisCanvas.width,
      colorAxisCanvas.height,
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
        settings.spectrogramAmplitudeRange,
      );
      colorContext.fillRect(x, 0, colorCanvas.width / 100, colorCanvas.height);
    }
  }
}

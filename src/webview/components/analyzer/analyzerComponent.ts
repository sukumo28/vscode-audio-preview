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
import FigureInteractionComponent from "../figureInteraction/figureInteractionComponent";
import AnalyzeSettingsComponent from "../analyzeSettings/analyzeSettingsComponent";

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
    autoAnalyze: boolean,
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
        <div class="analyzeSettingBox"></div>
        <div class="analyzeResultBox"></div>
      </div>
    `;

    new AnalyzeSettingsComponent(
      `${this._componentRootSelector} .analyzeSettingBox`,
      this._analyzeService,
      this._analyzeSettingsService,
    );

    // init analyze setting menu
    const analyzeSettingElement = this._componentRoot.querySelector(
      ".analyzeSettingBox",
    ) as HTMLElement;
    analyzeSettingElement.style.display = "none";
    this._analyzeSettingButton = <HTMLButtonElement>(
      this._componentRoot.querySelector(".analyzeSettingButton")
    );
    this._analyzeSettingButton.onclick = () => {
      const settings = this._componentRoot.querySelector(
        ".analyzeSettingBox",
      ) as HTMLElement;
      if (settings.style.display !== "block") {
        settings.style.display = "block";
        this._analyzeSettingButton.textContent = "▲settings";
      } else {
        settings.style.display = "none";
        this._analyzeSettingButton.textContent = "▼settings";
      }
    };

    this._addEventlistener(this._analyzeService, EventType.ANALYZE, () => {
      this.renderAnalyzeResult();
    });

    // init analyze button
    this._analyzeButton = <HTMLButtonElement>(
      this._componentRoot.querySelector(".analyzeButton")
    );
    this._analyzeButton.onclick = () => {
      this._analyzeService.analyze();
    };

    // init analyze result box
    this._analyzeResultBox =
      this._componentRoot.querySelector(".analyzeResultBox");

    // analyze if user set autoAnalyze true
    if (autoAnalyze) {
      this._analyzeService.analyze();
    }
  }

  private clearAnalyzeResult() {
    for (const c of Array.from(this._analyzeResultBox.children)) {
      this._analyzeResultBox.removeChild(c);
    }
  }

  private renderAnalyzeResult() {
    // disable analyze button
    this._analyzeButton.style.display = "none";
    // clear previous result
    this.clearAnalyzeResult();

    const settings = this._analyzeSettingsService.toProps();
    console.log("analyze", settings);

    for (let ch = 0; ch < this._audioBuffer.numberOfChannels; ch++) {
      if (this._analyzeSettingsService.waveformVisible) {
        const canvasBox = document.createElement("div");
        const canvasBoxClass = `js-canvasBoxWaveform${ch}`;
        canvasBox.classList.add("canvasBox", canvasBoxClass);
        this._analyzeResultBox.appendChild(canvasBox);

        new WaveFormComponent(
          `${this._componentRootSelector} .analyzeResultBox .${canvasBoxClass}`,
          AnalyzeSettingsService.WAVEFORM_CANVAS_WIDTH,
          AnalyzeSettingsService.WAVEFORM_CANVAS_HEIGHT *
            this._analyzeSettingsService.waveformVerticalScale,
          settings,
          this._audioBuffer.sampleRate,
          this._audioBuffer.getChannelData(ch),
          ch,
          this._audioBuffer.numberOfChannels,
        );

        new FigureInteractionComponent(
          `${this._componentRootSelector} .analyzeResultBox .${canvasBoxClass}`,
          true,
          this._playerService,
          this._analyzeService,
          this._analyzeSettingsService,
          this._audioBuffer,
          settings,
        );
      }

      if (this._analyzeSettingsService.spectrogramVisible) {
        const canvasBox = document.createElement("div");
        const canvasBoxClass = `js-canvasBoxSpectrogram${ch}`;
        canvasBox.classList.add("canvasBox", canvasBoxClass);
        this._analyzeResultBox.appendChild(canvasBox);

        new SpectrogramComponent(
          `${this._componentRootSelector} .analyzeResultBox .${canvasBoxClass}`,
          AnalyzeSettingsService.SPECTROGRAM_CANVAS_WIDTH,
          AnalyzeSettingsService.SPECTROGRAM_CANVAS_HEIGHT *
            this._analyzeSettingsService.spectrogramVerticalScale,
          this._analyzeService,
          settings,
          this._audioBuffer.sampleRate,
          ch,
          this._audioBuffer.numberOfChannels,
        );

        new FigureInteractionComponent(
          `${this._componentRootSelector} .analyzeResultBox .${canvasBoxClass}`,
          false,
          this._playerService,
          this._analyzeService,
          this._analyzeSettingsService,
          this._audioBuffer,
          settings,
        );
      }
    }

    // enable analyze button
    this._analyzeButton.style.display = "block";
  }
}

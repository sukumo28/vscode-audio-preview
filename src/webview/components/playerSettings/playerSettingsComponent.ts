import "./playerSettingsComponent.css";
import Component from "../../component";
import { EventType } from "../../events";
import PlayerService from "../../services/playerService";
import PlayerSettingsService from "../../services/playerSettingsService";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";

export default class PlayerSettingsComponent extends Component {
  private _componentRoot: HTMLElement;
  private _playerService: PlayerService;
  private _playerSettingsService: PlayerSettingsService;
  private _analyzeService: AnalyzeService;
  private _analyzeSettingService: AnalyzeSettingsService;

  constructor(
    componentRootSelector: string,
    playerService: PlayerService,
    playerSettingsService: PlayerSettingsService,
    analyzeService: AnalyzeService,
    analyzeSettingService: AnalyzeSettingsService,
  ) {
    super();
    this._componentRoot = document.querySelector(componentRootSelector);
    this._playerService = playerService;
    this._playerSettingsService = playerSettingsService;
    this._analyzeService = analyzeService;
    this._analyzeSettingService = analyzeSettingService;

    this._componentRoot.innerHTML = `
    <div class="playerSetting">
      <h3>Filters</h3>
      <div>
          <input class="playerSetting__input js-playerSetting-enableHpf" type="checkbox">high-pass:  
          <input class="playerSetting__input js-playerSetting-hpfFrequency" type="number" min="10" max="100000" step="10"> Hz
      </div>
      <div>
          <input class="playerSetting__input js-playerSetting-enableLpf" type="checkbox">low-pass:  
          <input class="playerSetting__input js-playerSetting-lpfFrequency" type="number" min="10" max="100000" step="10"> Hz
      </div>      
      <div>
          <input class="playerSetting__input js-playerSetting-matchFilterFrequencyToSpectrogram" type="checkbox"> match to spectrogram frequency range
      </div>
    </div>
    `;

    this.initPlayerSettingUI();
  }

  private initPlayerSettingUI() {
    const settings = this._playerSettingsService;

    // init match filter frequency checkbox
    const matchFilterFrequencyToSpectrogramInput =
      this._componentRoot.querySelector(
        ".js-playerSetting-matchFilterFrequencyToSpectrogram",
      ) as HTMLInputElement;
    matchFilterFrequencyToSpectrogramInput.checked =
      settings.matchFilterFrequencyToSpectrogram;
    this._addEventlistener(
      matchFilterFrequencyToSpectrogramInput,
      EventType.CHANGE,
      () => {
        hpfFrequencyInput.readOnly = matchFilterFrequencyToSpectrogramInput.checked;
        lpfFrequencyInput.readOnly = matchFilterFrequencyToSpectrogramInput.checked;
        hpfFrequencyInput.value = `${this._analyzeSettingService.minFrequency}`;
        lpfFrequencyInput.value = `${this._analyzeSettingService.maxFrequency}`;

        settings.matchFilterFrequencyToSpectrogram =
          matchFilterFrequencyToSpectrogramInput.checked;
        settings.hpfFrequency = Number(hpfFrequencyInput.value);
        settings.lpfFrequency = Number(lpfFrequencyInput.value);
        this.applyFilters();
      },
    );
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM,
      (e: CustomEventInit) => {
        matchFilterFrequencyToSpectrogramInput.checked = e.detail.value;
      },
    );

    // init enable high-pass filter checkbox
    const enableHpfInput = this._componentRoot.querySelector(".js-playerSetting-enableHpf") as HTMLInputElement;
    enableHpfInput.checked = settings.enableHpf;
    this._addEventlistener(enableHpfInput, EventType.CHANGE, () => {
      settings.enableHpf = enableHpfInput.checked;
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_ENABLE_HPF,
      (e: CustomEventInit) => {
        enableHpfInput.checked = e.detail.value;
        this.applyFilters();
      },
    );

    // init high-pass filter frequency input
    const hpfFrequencyInput = this._componentRoot.querySelector(".js-playerSetting-hpfFrequency") as HTMLInputElement;
    hpfFrequencyInput.value = `${settings.hpfFrequency}`;
    this._addEventlistener(hpfFrequencyInput, EventType.INPUT, () => {
      settings.hpfFrequency = Number(hpfFrequencyInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_HPF_FREQUENCY,
      (e: CustomEventInit) => {
        hpfFrequencyInput.value = `${e.detail.value}`;
        this.applyFilters();
      },
    );

    // init enable low-pass filter checkbox
    const enableLpfInput = this._componentRoot.querySelector(".js-playerSetting-enableLpf") as HTMLInputElement;
    enableLpfInput.checked = settings.enableLpf;
    this._addEventlistener(enableLpfInput, EventType.CHANGE, () => {
      settings.enableLpf = enableLpfInput.checked;
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_ENABLE_LPF,
      (e: CustomEventInit) => {
        enableLpfInput.checked = e.detail.value;
        this.applyFilters();
      },
    );

    // init low-pass filter frequency input
    const lpfFrequencyInput = this._componentRoot.querySelector(".js-playerSetting-lpfFrequency") as HTMLInputElement;
    lpfFrequencyInput.value = `${settings.lpfFrequency}`;
    this._addEventlistener(lpfFrequencyInput, EventType.INPUT, () => {
      settings.lpfFrequency = Number(lpfFrequencyInput.value);
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_LPF_FREQUENCY,
      (e: CustomEventInit) => {
        lpfFrequencyInput.value = `${e.detail.value}`;
        this.applyFilters();
      },
    );

    this._addEventlistener(this._analyzeService, EventType.ANALYZE, () => {
      if (matchFilterFrequencyToSpectrogramInput.checked) {
        hpfFrequencyInput.value = `${this._analyzeSettingService.minFrequency}`;
        settings.hpfFrequency = Number(hpfFrequencyInput.value);

        lpfFrequencyInput.value = `${this._analyzeSettingService.maxFrequency}`;
        settings.lpfFrequency = Number(lpfFrequencyInput.value);
        this.applyFilters();
      }
    });
  }

  private applyFilters() {
    if (this._playerService.isPlaying) {
      this._playerService.pause();
      this._playerService.play();
    }
  }
}

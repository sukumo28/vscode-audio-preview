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
    const matchFilterFrequencyToSpectrogram = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-playerSetting-matchFilterFrequencyToSpectrogram")
    );
    matchFilterFrequencyToSpectrogram.checked = settings.matchFilterFrequencyToSpectrogram;
    this._addEventlistener(matchFilterFrequencyToSpectrogram, EventType.CHANGE, () => {
      hpfFrequency.readOnly = matchFilterFrequencyToSpectrogram.checked;
      lpfFrequency.readOnly = matchFilterFrequencyToSpectrogram.checked;
      hpfFrequency.value = String(this._analyzeSettingService.minFrequency);
      lpfFrequency.value = String(this._analyzeSettingService.maxFrequency);

      settings.matchFilterFrequencyToSpectrogram = matchFilterFrequencyToSpectrogram.checked;
      settings.hpfFrequency = Number(hpfFrequency.value);
      settings.lpfFrequency = Number(lpfFrequency.value);

      this.applyFilters();
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM,
      (e: CustomEventInit) => {
        matchFilterFrequencyToSpectrogram.checked = e.detail.value;
      },
    );

    // init enable high-pass filter checkbox
    const enableHpf = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-playerSetting-enableHpf")
    );
    enableHpf.checked = settings.enableHpf;
    this._addEventlistener(enableHpf, EventType.CHANGE, () => {
      settings.enableHpf = enableHpf.checked;
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_ENABLE_HPF,
      (e: CustomEventInit) => {
        enableHpf.checked = e.detail.value;
        this.applyFilters();
      },
    );

    // init high-pass filter frequency input
    const hpfFrequency = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-playerSetting-hpfFrequency")
    );
    hpfFrequency.value = `${settings.hpfFrequency}`;
    this._addEventlistener(hpfFrequency, EventType.INPUT, () => {
      settings.hpfFrequency = Number(hpfFrequency.value);
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_HPF_FREQUENCY,
      (e: CustomEventInit) => {
        hpfFrequency.value = `${e.detail.value}`;
        this.applyFilters();
      },
    );

    // init enable low-pass filter checkbox
    const enableLpf = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-playerSetting-enableLpf")
    );
    enableLpf.checked = settings.enableLpf;
    this._addEventlistener(enableLpf, EventType.CHANGE, () => {
      settings.enableLpf = enableLpf.checked;
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_ENABLE_LPF,
      (e: CustomEventInit) => {
        enableLpf.checked = e.detail.value;
        this.applyFilters();
      },
    );

    // init low-pass filter frequency input
    const lpfFrequency = <HTMLInputElement>(
      this._componentRoot.querySelector(".js-playerSetting-lpfFrequency")
    );
    lpfFrequency.value = `${settings.lpfFrequency}`;
    this._addEventlistener(lpfFrequency, EventType.INPUT, () => {
      settings.lpfFrequency = Number(lpfFrequency.value);
    });
    this._addEventlistener(
      settings,
      EventType.PS_UPDATE_LPF_FREQUENCY,
      (e: CustomEventInit) => {        
        lpfFrequency.value = `${e.detail.value}`;
        this.applyFilters();
      },
    );

    this._addEventlistener(
      this._analyzeService,
      EventType.ANALYZE,
      () => {
        if (matchFilterFrequencyToSpectrogram.checked){
          hpfFrequency.value = `${this._analyzeSettingService.minFrequency}`;
          settings.hpfFrequency = Number(hpfFrequency.value);

          lpfFrequency.value = `${this._analyzeSettingService.maxFrequency}`;
          settings.lpfFrequency = Number(lpfFrequency.value);

          this.applyFilters();
        }
      },
    );
  }
  
  private applyFilters()
  {
    if (this._playerService.isPlaying) {
      this._playerService.pause();
      this._playerService.play();
    }    
  }
}

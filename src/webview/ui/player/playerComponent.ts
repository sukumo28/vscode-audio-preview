import { Disposable } from "../../../dispose";
import { Event, EventType } from "../../events";
import PlayerService from "../../service/playerService";
import PlayerSettingsService from "../../service/playerSettingsService";
import "./playerComponent.css";

export default class PlayerComponent extends Disposable {
  private _componentRoot: HTMLElement;
  private _playButton: HTMLButtonElement;
  private _volumeBar: HTMLInputElement;
  private _playerService: PlayerService;
  private _playerSettingService: PlayerSettingsService;

  constructor(
    componentRootID: string,
    playerService: PlayerService,
    playerSettingService: PlayerSettingsService
  ) {
    super();
    this._playerService = playerService;
    this._playerSettingService = playerSettingService;

    // init base html
    this._componentRoot = document.querySelector(componentRootID);

    const volumeBar = this._playerSettingService.volumeUnitDb
      ? `<div class="volumeText">volume 0.0 dB</div>
             <input type="range" class="volumeBar" value="0" min="-80" max="0" step="0.5">`
      : `<div class="volumeText">volume 100</div>
             <input type="range" class="volumeBar" value="100">`;

    this._componentRoot.innerHTML = `
      <div class="playerComponent">
        <button class="playButton">play</button>

        ${volumeBar}
                    
        <div class="seekPosText">position 0.000 s</div>
        <div class="seekBarBox">
            <input type="range" class="seekBar" value="0" />
            <input type="range" class="userInputSeekBar inputSeekBar" value="0" />
        </div>
      </div>
    `;

    // init main seekbar event
    // To avoid inconvenience when the timing of user input overlaps with the change in value over time,
    // we separate the InputElement for display and the InputElement that actually accepts user input.
    const userinputSeekbar = <HTMLInputElement>(
      this._componentRoot.querySelector(".userInputSeekBar")
    );
    this._register(
      new Event(userinputSeekbar, EventType.CHANGE, () => {
        this._playerService.onSeekbarInput(Number(userinputSeekbar.value));
        // We reset the value of the input element for user input to 100 each time,
        // because it does not respond when the user inputs exactly the same value as the previous one.
        // Since 100 is the value at the end of playback, there is no problem if it does not respond.
        userinputSeekbar.value = "100";
      })
    );
    const visibleSeekbar = <HTMLInputElement>(
      this._componentRoot.querySelector(".seekBar")
    );
    const seekPosText = <HTMLInputElement>(
      this._componentRoot.querySelector(".seekPosText")
    );
    this._register(
      new Event(window, EventType.UPDATE_SEEKBAR, (e: CustomEventInit) => {
        visibleSeekbar.value = e.detail.value;
        seekPosText.textContent =
          "position " + Number(e.detail.pos).toFixed(3) + " s";
      })
    );

    // init volumebar
    this._volumeBar = <HTMLInputElement>(
      this._componentRoot.querySelector(".volumeBar")
    );
    const volumeText = <HTMLInputElement>(
      this._componentRoot.querySelector(".volumeText")
    );
    const updateVolume = () => {
      if (this._playerSettingService.volumeUnitDb) {
        // convert dB setting to linear gain
        // -80 dB is treated as mute
        const voldb = Number(this._volumeBar.value);
        const vollin = voldb === -80 ? 0 : Math.pow(10, voldb / 20);
        this._playerService.volume = vollin;
        volumeText.textContent =
          "volume " + (vollin === 0 ? "muted" : voldb.toFixed(1) + " dB");
      } else {
        // convert seekbar value(0~100) to volume(0~1)
        this._playerService.volume = Number(this._volumeBar.value) / 100;
        volumeText.textContent = "volume " + this._volumeBar.value;
      }
    };
    this._register(new Event(this._volumeBar, EventType.INPUT, updateVolume));
    this._volumeBar.value = String(
      this._playerSettingService.volumeUnitDb
        ? this._playerSettingService.initialVolumeDb
        : this._playerSettingService.initialVolume
    );
    updateVolume();

    // init play button
    this._playButton = <HTMLButtonElement>(
      this._componentRoot.querySelector(".playButton")
    );
    this._register(
      new Event(this._playButton, EventType.CLICK, () => {
        if (this._playerService.isPlaying) {
          this._playerService.pause();
        } else {
          this._playerService.play();
        }
      })
    );
    this._playButton.textContent = "play";
    this._playButton.style.display = "block";
    this._register(
      new Event(window, EventType.UPDATE_IS_PLAYING, () => {
        if (this._playerService.isPlaying) {
          this._playButton.textContent = "pause";
        } else {
          this._playButton.textContent = "play";
        }
      })
    );

    // register keyboard shortcuts
    // don't use command.register at audioPreviewEditorProvider.openCustomDocument due to command confliction
    this._register(
      new Event(window, EventType.KEY_DOWN, (e: KeyboardEvent) => {
        if (e.isComposing || e.code !== "Space") {
          return;
        }
        e.preventDefault();
        this._playButton.click();
      })
    );
  }

  public dispose() {
    if (this._playerService.isPlaying) {
      this._playerService.pause();
    }
    super.dispose();
  }
}

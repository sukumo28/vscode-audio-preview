import { Disposable } from "../dispose";

export class EventType {
  // vscode
  public static readonly VSCODE_MESSAGE = "message";
  // player
  public static readonly UPDATE_SEEKBAR = "update-seekbar";
  public static readonly UPDATE_IS_PLAYING = "update-is-playing";
  // playerSettings
  public static readonly PS_UPDATE_ENABLE_HPF = "update-enable-hpf";
  public static readonly PS_UPDATE_HPF_FREQUENCY = "update-hpf-frequency";
  public static readonly PS_UPDATE_ENABLE_LPF = "update-enable-lpf";
  public static readonly PS_UPDATE_LPF_FREQUENCY = "update-lpf-frequency";
  public static readonly PS_UPDATE_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM = "update-match-filter-frequency-to-spectrogram";
  // analyzer
  public static readonly ANALYZE = "analyze";
  // analyzeSettings
  public static readonly AS_UPDATE_WAVEFORM_VISIBLE =
    "as-update-waveform-visible";
  public static readonly AS_UPDATE_SPECTROGRAM_VISIBLE =
    "as-update-spectrogram-visible";
  public static readonly AS_UPDATE_WINDOW_SIZE_INDEX =
    "as-update-window-size-index";
  public static readonly AS_UPDATE_FREQUENCY_SCALE =
    "as-update-frequency-scale";
  public static readonly AS_UPDATE_MEL_FILTER_NUM = "as-update-mel-filter-num";
  public static readonly AS_UPDATE_MIN_FREQUENCY = "as-update-min-frequency";
  public static readonly AS_UPDATE_MAX_FREQUENCY = "as-update-max-frequency";
  public static readonly AS_UPDATE_MIN_TIME = "as-update-min-time";
  public static readonly AS_UPDATE_MAX_TIME = "as-update-max-time";
  public static readonly AS_UPDATE_MIN_AMPLITUDE = "as-update-min-amplitude";
  public static readonly AS_UPDATE_MAX_AMPLITUDE = "as-update-max-amplitude";
  public static readonly AS_UPDATE_SPECTROGRAM_AMPLITUDE_RANGE =
    "as-update-spectrogram-amplitude-range";
  // other
  public static readonly CLICK = "click";
  public static readonly CHANGE = "change";
  public static readonly INPUT = "input";
  public static readonly KEY_DOWN = "keydown";
  public static readonly MOUSE_DOWN = "mousedown";
  public static readonly MOUSE_MOVE = "mousemove";
  public static readonly MOUSE_UP = "mouseup";
  public static readonly CONTEXT_MENU = "contextmenu";
}

export class DisposableEventListener extends Disposable {
  private _target: EventTarget;
  private _type: string;
  private _handler: EventListenerOrEventListenerObject;

  constructor(
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
  ) {
    super();
    this._target = target;
    this._type = type;
    this._handler = handler;
    this._target.addEventListener(this._type, this._handler);
  }

  dispose() {
    this._target.removeEventListener(this._type, this._handler);
  }
}

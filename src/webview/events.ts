import { Disposable } from "../dispose";

export const EventType = {
    // vscode
    VSCodeMessage: "message", 
    // player
    UpdateSeekbar: "update-seekbar",
    InputSeekbar: "input-seekbar",
    UpdateIsPlaying: "update-is-playing",
    // analyzeSettings
    AS_UpdateWaveformVisible: "as-update-waveform-visible",
    AS_UpdateSpectrogramVisible: "as-update-spectrogram-visible",
    AS_UpdateWindowSizeIndex: "as-update-window-size-index",
    AS_UpdateFrequencyScale: "as-update-frequency-scale",
    AS_UpdateMelFilterNum: "as-update-mel-filter-num",
    AS_UpdateMinFrequency: "as-update-min-frequency",
    AS_UpdateMaxFrequency: "as-update-max-frequency",
    AS_UpdateMinTime: "as-update-min-time",
    AS_UpdateMaxTime: "as-update-max-time",
    AS_UpdateMinAmplitude: "as-update-min-amplitude",
    AS_UpdateMaxAmplitude: "as-update-max-amplitude",
    AS_UpdateSpectrogramAmplitudeRange: "as-update-spectrogram-amplitude-range",
    // other
    Click: "click",
    Change: "change",
    KeyDown: "keydown"
};

export class Event extends Disposable {
    private _target: EventTarget;
    private _type:string; 
    private _handler: EventListenerOrEventListenerObject;

    constructor(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject) {
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
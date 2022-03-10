import { Disposable } from "../dispose";

export const EventType = {
    UpdateSeekbar: "update-seekbar",
    InputSeekbar: "input-seekbar",
    PostMessage: "post-message",
    VSCodeMessage: "message", 

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
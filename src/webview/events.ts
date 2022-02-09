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
    target: EventTarget;
    type:string; 
    handler: EventListenerOrEventListenerObject;

    constructor(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject) {
        super();
        this.target = target;
        this.type = type;
        this.handler = handler;
        this.target.addEventListener(this.type, this.handler);
    }

    dispose() {
        this.target.removeEventListener(this.type, this.handler);
    }
}
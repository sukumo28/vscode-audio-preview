import { Disposable } from "../dispose";
import { DisposableEventListener } from "./events";

export default class Component extends Disposable {
  constructor() {
    super();
  }

  protected _addEventlistener(
    target: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
  ) {
    this._register(new DisposableEventListener(target, type, handler));
  }
}

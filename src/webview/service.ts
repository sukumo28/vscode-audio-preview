import { Disposable } from "../dispose";

export default class Service extends Disposable implements EventTarget {
  private _listeners: Map<string, EventListener[]> = new Map();

  constructor() {
    super();
  }

  public addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type).push(listener as EventListener);
  }

  public dispatchEvent(event: Event): boolean {
    const listeners = this._listeners.get(event.type);
    if (!listeners) {
      return true;
    }
    for (const listener of listeners) {
      listener(event);
    }
    return !event.defaultPrevented;
  }

  public removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject
  ): void {
    const listeners = this._listeners.get(type);
    if (!listeners) {
      return;
    }
    const index = listeners.indexOf(callback as EventListener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  public dispose() {
    this._listeners.clear();
    super.dispose();
  }
}

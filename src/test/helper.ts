import { ExtMessage, WebviewMessage, WebviewMessageType } from "../message";
import { EventType } from "../webview/events";

function postMessage(target: EventTarget, message: ExtMessage | WebviewMessage) {
    const event = new MessageEvent(EventType.VSCodeMessage, {
        data: message
    });
    target.dispatchEvent(event);
}

export function postMessageFromExt(message: ExtMessage) {
    postMessage(window, message);
}

// Use different targets to prevent webview from receiving its own messages
const webviewMessageTarget = document.createElement("div");

export function postMessageFromWebview(message: WebviewMessage) {
    postMessage(webviewMessageTarget, message);
}

export async function waitVSCodeMessageForAction(action: Function, timeout: number = 1000): Promise<ExtMessage | WebviewMessage> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            postMessageFromWebview({ type: WebviewMessageType.Error, data: { message: "Timeout" } });
        }, timeout);

        webviewMessageTarget.addEventListener(EventType.VSCodeMessage, (e: MessageEvent<ExtMessage | WebviewMessage>) => {
            clearTimeout(timer);
            if (e.data.type === WebviewMessageType.Error) { console.log(e.data.data.message); }
            resolve(e.data);
        }, { once: true });

        action();
    });
}

export async function waitEventForAction(action: Function, target: EventTarget, expectedEventType: string, timeout: number = 1000): Promise<any> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject("Timeout");
        }, timeout);

        target.addEventListener(expectedEventType, (e: CustomEvent) => {
            clearTimeout(timer);
            resolve(e.detail);
        }, { once: true });

        action();
    });
}


export class MockAudioBuffer {
    numberOfChannels: number;
    length: number;
    sampleRate: number;
    duration: number;
    data: Float32Array[];

    constructor (numberOfChannels: number, length: number, sampleRate: number) {
        this.numberOfChannels = numberOfChannels;
        this.length = length;
        this.sampleRate = sampleRate;
        this.duration = this.length / this.sampleRate;
        this.data = [];
        for (let ch = 0; ch < this.numberOfChannels; ch++) {
            this.data.push(new Float32Array(length));
        }
    }

    getChannelData(ch: number) {
        return this.data[ch];
    }

    copyToChannel(source: Float32Array, ch: number, bo?: number) {
        if (!bo || bo < 0) {bo = 0;}
        for (let i = 0; i < source.length; i++) {
            if (this.data[ch].length <= bo + i) {break;}
            this.data[ch][bo + i] = source[i];
        }
    }
}

class MockAudioNode {
    connect(destinationNode: AudioNode, output?: number, input?: number) {}
}

class MockAudioParam {
    value: number;
}

class MockGainNode extends MockAudioNode {
    gain: MockAudioParam;

    constructor () {
        super();
        this.gain = { value: 1 };
    }
}

class MockAudioBufferSourceNode extends MockAudioNode {
    buffer: MockAudioBuffer;

    start(when?: number, offset?: number, duration?: number): void {}

    stop() {}
}

class MockDestinationNode extends MockAudioNode {}

class MockAudioContext extends MockAudioNode {
    sampleRate: number;
    destination: MockAudioNode;
    currentTime: number;

    constructor (sampleRate: number) {
        super();
        this.sampleRate = sampleRate;
        this.destination = new MockDestinationNode();
        this.currentTime = 0;
        setInterval(() => {
            this.currentTime += 0.01;
        }, 10);
    }

    createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
        return new MockAudioBuffer(numberOfChannels, length, sampleRate);
    }

    createBufferSource() {
        return new MockAudioBufferSourceNode();
    }

    createGain() {
        return new MockGainNode();
    }
}

export function createAudioContext(sampleRate: number) {
    return new MockAudioContext(sampleRate) as unknown as AudioContext;
}

export async function wait(ms: number) {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function getRandomFloatOutOf(min: number, max: number) {
    const r = Math.random();
    if (r < 0.5) {
        return getRandomFloat(Number.MIN_SAFE_INTEGER, min - Number.EPSILON);
    } else {
        return getRandomFloat(max + Number.EPSILON, Number.MAX_SAFE_INTEGER);
    }
}

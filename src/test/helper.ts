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

let timer;
export async function receiveReaction(preTask: Function, timeout: number = 1000): Promise<ExtMessage | WebviewMessage> {
    return new Promise((resolve) => {
        timer = setTimeout(() => {
            postMessageFromWebview({ type: WebviewMessageType.Error, data: { message: "Timeout" } });
        }, timeout);

        webviewMessageTarget.addEventListener(EventType.VSCodeMessage, (e: MessageEvent<ExtMessage | WebviewMessage>) => {
            clearTimeout(timer);
            if (e.data.type === WebviewMessageType.Error) { console.log(e.data.data.message); }
            resolve(e.data);
        }, { once: true });

        preTask();
    });
}

class MockAudioBuffer {
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
        if (!bo || bo < 0) bo = 0;
        for (let i = 0; i < source.length; i++) {
            if (this.data[ch].length <= bo + i) break;
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
        return new MockAudioBufferSourceNode()
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
import { ExtMessage, WebviewMessage } from "../message";
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

export async function receiveReaction(preTask: Function): Promise<ExtMessage | WebviewMessage> {
    return new Promise((resolve) => {
        webviewMessageTarget.addEventListener(EventType.VSCodeMessage, (e: MessageEvent<ExtMessage | WebviewMessage>) => {
            resolve(e.data);
        }, { once: true });

        preTask();
    });
}

export function createAudioContext(sampleRate: number) {
    return {
        sampleRate,
        createBuffer: (numberOfChannels: number, length: number, sampleRate: number) => {
            return {
                numberOfChannels, length, sampleRate,
                getChannelData: (ch: number) => new Float32Array(length),
                copyToChannel: (source: Float32Array, ch: number, bo?: number) => { },
            } as AudioBuffer
        },
        createGain: () => {
            return {
                connect: (destinationNode: AudioNode, output?: number, input?: number) => { }
            } as GainNode
        }
    } as AudioContext;
}

export async function wait(ms: number) {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
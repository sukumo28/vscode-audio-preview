import { ExtMessage, ExtMessageType, WebviewMessage, WebviewMessageType } from "../message";
import { EventType } from "../webview/events";
import WebView from "../webview/webview";

function postMessage(target: EventTarget, message: ExtMessage | WebviewMessage) {
    const event = new MessageEvent(EventType.VSCodeMessage, {
        data: message
    });
    target.dispatchEvent(event);
}

function postMessageFromExt(message: ExtMessage) {
    postMessage(window, message);
}

// Use different targets to prevent webview from receiving its own messages
const webviewMessageTarget = document.createElement("div");

function postMessageFromWebview(message: WebviewMessage) {
    postMessage(webviewMessageTarget, message);
}

async function receiveReaction(preTask: Function): Promise<ExtMessage | WebviewMessage> {
    return new Promise((resolve) => {
        webviewMessageTarget.addEventListener(EventType.VSCodeMessage, (e: MessageEvent<ExtMessage | WebviewMessage>) => {
            resolve(e.data);
        }, { once: true });

        preTask();
    });
}

const createAudioContext = (sampleRate: number) => {
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

describe("WebView normal flow", () => {
    let webView: WebView;

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        webView.dispose();
        webView = undefined;
    });

    test("init", async () => {
        const msg = await receiveReaction(() => {
            webView = new WebView(postMessageFromWebview, createAudioContext);
        });

        expect(msg.type).toBe(WebviewMessageType.Ready);
    });

    test("should return Prepare message", async () => {
        const msg = await receiveReaction(() => postMessageFromExt({
            type: ExtMessageType.Info,
            data: {
                encoding: "", format: "", numChannels: 1, sampleRate: 1, fileSize: 1, isTrusted: true
            }
        }));

        expect(msg.type).toBe(WebviewMessageType.Prepare);
    });

    test("should create InfoTable", async () => {
        expect(document.querySelector("#info-table > table")).not.toBe(null);
    });

    test("should return Data message", async () => {
        const msg = await receiveReaction(() => postMessageFromExt({
            type: ExtMessageType.Prepare,
            data: {
                duration: 1, sampleRate: 44100, numberOfChannels: 1, length: 44100,
                analyzeDefault: {
                    windowSizeIndex: 2, minAmplitude: -1, maxAmplitude: 1,
                    minFrequency: 0, maxFrequency: 8000, spectrogramAmplitudeRange: -90
                }
            }
        }));

        expect(msg.type).toBe(WebviewMessageType.Data);
    });

    test("should create Player", async () => {
        expect(document.querySelector("#listen-button")).not.toBe(null);
    });

    test("should create Analyzer", async () => {
        expect(document.querySelector("#analyze-button")).not.toBe(null);
    });

    test("should reset and return Ready message when file is reloaded", async () => {
        const msg = await receiveReaction(() => postMessageFromExt({
            type: ExtMessageType.Reload
        }));

        expect(msg.type).toBe(WebviewMessageType.Ready);
    });

    test("should not have InfoTable after reset", async () => {
        expect(document.querySelector("#info-table > table")).toBe(null);
    });

    test("should not have Player after reset", async () => {
        expect(document.querySelector("#listen-button")).toBe(null);
    });

    test("should not have Analyzer after reset", async () => {
        expect(document.querySelector("#analyze-button")).toBe(null);
    });
});

describe("WebView in untrusted workspace", () => {
    let webView: WebView;

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        webView.dispose();
        webView = undefined;
    });

    test("init", async () => {
        const msg = await receiveReaction(() => {
            webView = new WebView(postMessageFromWebview, createAudioContext);
        });

        expect(msg.type).toBe(WebviewMessageType.Ready);
    });

    test("should return Error message instead of Prepare message", async () => {
        const msg = await receiveReaction(() => postMessageFromExt({
            type: ExtMessageType.Info,
            data: {
                encoding: "", format: "", numChannels: 1, sampleRate: 1, fileSize: 1, isTrusted: false
            }
        }));

        expect(msg.type).toBe(WebviewMessageType.Error);
    });
});
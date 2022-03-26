import { ExtMessageType, WebviewMessageType } from "../message";
import { postMessageFromExt, postMessageFromWebview, receiveReaction, createAudioContext } from "./helper";
import WebView from "../webview/ui/webview";

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
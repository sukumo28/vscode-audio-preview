import { AnalyzeDefault } from "../analyzeSettings";
import { ExtMessageType, WebviewMessageType } from "../message";
import Analyzer from "../webview/analyzer";
import { createAudioContext, postMessageFromExt, postMessageFromWebview, receiveReaction, wait } from "./helper";

describe("Analyzer normal flow", () => {
    let analyzer: Analyzer;

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        analyzer.dispose();
        analyzer = undefined;
    });

    test("init", () => {
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
        const ad: AnalyzeDefault = {
            windowSizeIndex: 2,
            minAmplitude: -1,
            maxAmplitude: 1,
            minFrequency: 0,
            maxFrequency: 8000,
            spectrogramAmplitudeRange: -90,
        };
        analyzer = new Analyzer("root", audioBuffer, ad, postMessageFromWebview);

        expect(document.getElementById("analyze-controller-buttons")).not.toBe(null);
    });

    test("should not show analyze button untill finish receiving data", () => {
        expect(document.getElementById("analyze-button").style.display).toBe("none");
    });

    test("does not activate by non-ended data message", async () => {
        postMessageFromExt({
            type: ExtMessageType.Data,
            data: {
                numberOfChannels: 2,
                length: 10000,
                samples: [[], []],
                start: 34099,
                end: 44099,
                wholeLength: 44100,
                autoAnalyze: false
            }
        });
        await wait(50);
        expect(document.getElementById("analyze-button").style.display).toBe("none");
    });

    test("activate after finish data messages", async () => {
        postMessageFromExt({
            type: ExtMessageType.Data,
            data: {
                numberOfChannels: 2,
                length: 10000,
                samples: [[], []],
                start: 34100,
                end: 44100,
                wholeLength: 44100,
                autoAnalyze: false
            }
        });
        await wait(50);
        expect(document.getElementById("analyze-button").style.display).toBe("block");
    });

    test("send MakeSpectrogram message when user click analyze button", async () => {
        const msg = await receiveReaction(() => {
            document.getElementById("analyze-button").click();
        });
        expect(msg.type).toBe(WebviewMessageType.MakeSpectrogram);
    });

    test("send Spectrogram message after got MakeSpectrogram message", async () => {
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.MakeSpectrogram,
                data: {
                    channel: 0,
                    settings: undefined
                }
            });
        });

        expect(msg).toEqual({
            type: WebviewMessageType.Spectrogram,
            data: {
                channel: 0,
                startBlockIndex: 0,
                blockSize: 60,
                settings: undefined
            }
        });
    });

    test("request next Spectrogram message after got Spectrogram message", async () => {
        const setting = {
            windowSize: 1024,
            hopSize: 512,
            minFrequency: 0,
            maxFrequency: 8000,
            minTime: 0,
            maxTime: 1,
            minAmplitude: -1,
            maxAmplitude: 1,
            spectrogramAmplitudeRange: -90,
            analyzeID: 1
        };
        
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.Spectrogram,
                data: {
                    channel: 0,
                    startBlockIndex: 0,
                    isEnd: false,
                    endBlockIndex: 1000,
                    spectrogram: [[]],
                    settings: setting
                }
            });
        });

        expect(msg).toEqual({
            type: WebviewMessageType.Spectrogram,
            data: {
                channel: 0,
                startBlockIndex: 1000,
                blockSize: 60,
                settings: setting
            }
        });
    });

    test("ignore Spectrogram message that has different analyzeID", async () => {
        const setting = {
            windowSize: 1024,
            hopSize: 512,
            minFrequency: 0,
            maxFrequency: 8000,
            minTime: 0,
            maxTime: 1,
            minAmplitude: -1,
            maxAmplitude: 1,
            spectrogramAmplitudeRange: -90,
            analyzeID: 0
        };
        
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.Spectrogram,
                data: {
                    channel: 0,
                    startBlockIndex: 0,
                    isEnd: false,
                    endBlockIndex: 1000,
                    spectrogram: [[]],
                    settings: setting
                }
            });
        });

        expect(msg).toEqual({
            type: WebviewMessageType.Error,
            data: {
                message: "Timeout",
            }
        });
    });

    test("don't request next Spectrogram message if isEnd=true", async () => {
        const setting = {
            windowSize: 1024,
            hopSize: 512,
            minFrequency: 0,
            maxFrequency: 8000,
            minTime: 0,
            maxTime: 1,
            minAmplitude: -1,
            maxAmplitude: 1,
            spectrogramAmplitudeRange: -90,
            analyzeID: 1
        };
        
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.Spectrogram,
                data: {
                    channel: 0,
                    startBlockIndex: 0,
                    isEnd: true,
                    endBlockIndex: 1000,
                    spectrogram: [[]],
                    settings: setting
                }
            });
        });

        expect(msg).toEqual({
            type: WebviewMessageType.Error,
            data: {
                message: "Timeout",
            }
        });
    });
});

describe("Analyzer autoAnalyze", () => {
    let analyzer: Analyzer;

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        analyzer.dispose();
        analyzer = undefined;
    });

    test("init", () => {
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
        const ad: AnalyzeDefault = {
            windowSizeIndex: 2,
            minAmplitude: -1,
            maxAmplitude: 1,
            minFrequency: 0,
            maxFrequency: 8000,
            spectrogramAmplitudeRange: -90,
        };
        analyzer = new Analyzer("root", audioBuffer, ad, postMessageFromWebview);

        expect(document.getElementById("analyze-controller-buttons")).not.toBe(null);
    });

    test("should not show analyze button untill finish receiving data", () => {
        expect(document.getElementById("analyze-button").style.display).toBe("none");
    });

    test("does not activate by non-ended data message", async () => {
        postMessageFromExt({
            type: ExtMessageType.Data,
            data: {
                numberOfChannels: 2,
                length: 10000,
                samples: [[], []],
                start: 34099,
                end: 44099,
                wholeLength: 44100,
                autoAnalyze: true
            }
        });
        await wait(50);
        expect(document.getElementById("analyze-button").style.display).toBe("none");
    });

    test("activate after finish data messages", async () => {
        postMessageFromExt({
            type: ExtMessageType.Data,
            data: {
                numberOfChannels: 2,
                length: 10000,
                samples: [[], []],
                start: 34100,
                end: 44100,
                wholeLength: 44100,
                autoAnalyze: true
            }
        });
        await wait(200);
        expect(document.getElementById("analyze-button").style.display).toBe("block");
    });

    test("start analyze automatically if autoAnalyze=true", async () => {
        await wait(400);
        expect(analyzer.latestAnalyzeID).toBe(1);
    });
});
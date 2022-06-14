import { AnalyzeDefault } from "../analyzeSettings";
import { ExtMessageType } from "../message";
import Analyzer from "../webview/ui/analyzer";
import { createAudioContext, postMessageFromExt, wait } from "./helper";

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
        analyzer = new Analyzer("root", audioBuffer, ad);

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
        analyzer = new Analyzer("root", audioBuffer, ad);

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
import { postMessageFromExt, wait } from "./helper";
import InfoTable from "../webview/ui/infoTable";
import { ExtMessageType } from "../message";

describe("infoTable normal flow", () => {
    let infoTable: InfoTable;

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        infoTable.dispose();
        infoTable = undefined;
    });

    test("init", () => {
        infoTable = new InfoTable("root");
        expect(document.querySelector("#root > table")).not.toBe(null);
    });

    test("show info", () => {
        infoTable.showInfo({
            encoding: "pcm_s16le",
            format: "s16",
            numChannels: 1,
            sampleRate: 44100,
            fileSize: 420524
        });

        expect(document.getElementById("info-table-encoding").textContent).toBe("pcm_s16le");
        expect(document.getElementById("info-table-format").textContent).toBe("s16");
        expect(document.getElementById("info-table-number_of_channel").textContent).toBe("1 (mono)");
        expect(document.getElementById("info-table-sample_rate").textContent).toBe("44100");
        expect(document.getElementById("info-table-file_size").textContent).toBe("420524 byte");
    });

    test("show duration", async () => {
        postMessageFromExt({
            type: ExtMessageType.Prepare,
            data: {
                duration: 1.12, sampleRate: 44100, numberOfChannels: 1, length: 44100,
                analyzeDefault: {
                    windowSizeIndex: 2, minAmplitude: -1, maxAmplitude: 1,
                    minFrequency: 0, maxFrequency: 8000, spectrogramAmplitudeRange: -90
                }
            }
        });

        await wait(50);
        expect(document.getElementById("info-table-duration").textContent).toBe("1.12s");
    });
});

describe("infoTable broken data", () => {
    let infoTable: InfoTable;

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        infoTable.dispose();
        infoTable = undefined;
    });

    test("init", () => {
        infoTable = new InfoTable("root");
        expect(document.querySelector("#root > table")).not.toBe(null);
    });

    test("show undefined info", () => {
        infoTable.showInfo(undefined);

        expect(document.getElementById("info-table-encoding")).toBe(null);
        expect(document.getElementById("info-table-format")).toBe(null);
        expect(document.getElementById("info-table-number_of_channel")).toBe(null);
        expect(document.getElementById("info-table-sample_rate")).toBe(null);
        expect(document.getElementById("info-table-file_size")).toBe(null);
    });

    test("show broken info", () => {
        infoTable.showInfo({
            encoding: undefined,
            format: undefined,
            numChannels: undefined,
            sampleRate: undefined,
            fileSize: undefined
        });

        expect(document.getElementById("info-table-encoding").textContent).toBe("undefined");
        expect(document.getElementById("info-table-format").textContent).toBe("undefined");
        expect(document.getElementById("info-table-number_of_channel").textContent).toBe("undefined (unsupported)");
        expect(document.getElementById("info-table-sample_rate").textContent).toBe("undefined");
        expect(document.getElementById("info-table-file_size").textContent).toBe("undefined byte");
    });

    test("show undefined duration", async () => {
        postMessageFromExt({
            type: ExtMessageType.Prepare,
            data: undefined
        });

        await wait(50);
        expect(document.getElementById("info-table-duration")).toBe(null);
    });

    test("show broken duration", async () => {
        postMessageFromExt({
            type: ExtMessageType.Prepare,
            data: {
                duration: undefined, sampleRate: 44100, numberOfChannels: 1, length: 44100,
                analyzeDefault: {
                    windowSizeIndex: 2, minAmplitude: -1, maxAmplitude: 1,
                    minFrequency: 0, maxFrequency: 8000, spectrogramAmplitudeRange: -90
                }
            }
        });

        await wait(50);
        expect(document.getElementById("info-table-duration").textContent).toBe("undefineds");
    });
});
import { ExtMessageType, WebviewMessageType } from "../../../message";
import Decoder from "../../../webview/decoder";
import Webview from "../../../webview/ui/webview";
import {
  waitVSCodeMessageForAction,
  postMessageFromWebview,
  postMessageFromExt,
  createAudioContext,
  wait,
} from "../../helper";

describe("webview lifecycle", () => {
  let webview: Webview;

  beforeAll(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterAll(() => {
    webview.dispose();
  });

  test("request config after init", async () => {
    const createDecoder = async () => {
      return new Promise<Decoder>((resolve) => {
        resolve({
          numChannels: 1,
          sampleRate: 44100,
          fileSize: 500001,
          format: "s16",
          encoding: "pcm_s16le",
          duration: 1,
          samples: [new Float32Array(44100)],
          length: 44100,
          readAudioInfo: () => {},
          decode: () => {},
          dispose: () => {},
        } as Decoder);
      });
    };

    const msg = await waitVSCodeMessageForAction(() => {
      webview = new Webview(
        postMessageFromWebview,
        createAudioContext,
        createDecoder,
      );
    });
    expect(msg.type).toBe(WebviewMessageType.CONFIG);
  });

  test("request data after getting config", async () => {
    const msg = await waitVSCodeMessageForAction(() => {
      postMessageFromExt({
        type: ExtMessageType.CONFIG,
        data: {
          autoAnalyze: false,
          playerDefault: {
            volumeUnitDb: undefined,
            initialVolumeDb: 0.0,
            initialVolume: 1.0,
          },
          analyzeDefault: {
            waveformVisible: undefined,
            waveformVerticalScale: undefined,
            spectrogramVisible: undefined,
            spectrogramVerticalScale: undefined,
            windowSizeIndex: undefined,
            minAmplitude: undefined,
            maxAmplitude: undefined,
            minFrequency: undefined,
            maxFrequency: undefined,
            spectrogramAmplitudeRange: undefined,
            frequencyScale: undefined,
            melFilterNum: undefined,
          },
        },
      });
    });
    expect(msg).toEqual({
      type: WebviewMessageType.DATA,
      data: { start: 0, end: 500000 },
    });
  });

  test("request next data after getting data", async () => {
    const msg = await waitVSCodeMessageForAction(() => {
      postMessageFromExt({
        type: ExtMessageType.DATA,
        data: {
          start: 0,
          end: 500000,
          wholeLength: 500001,
          samples: new Uint8Array(500000),
        },
      });
    });
    expect(msg).toEqual({
      type: WebviewMessageType.DATA,
      data: { start: 500000, end: 3500000 },
    });
  });

  test("init infoTable after finish receiving data", async () => {
    postMessageFromExt({
      type: ExtMessageType.DATA,
      data: {
        start: 500000,
        end: 3500000,
        wholeLength: 500001,
        samples: new Uint8Array(1),
      },
    });
    await wait(100);
    expect(document.getElementById("info-table")?.innerHTML).not.toBe("");
  });

  test("init player after finish receiving data", async () => {
    expect(document.getElementById("player")?.innerHTML).not.toBe("");
  });

  test("init analyzer after finish receiving data", async () => {
    expect(document.getElementById("analyzer")?.innerHTML).not.toBe("");
  });

  test("reload webview", async () => {
    const msg = await waitVSCodeMessageForAction(() => {
      postMessageFromExt({ type: ExtMessageType.RELOAD });
    });
    expect(msg).toEqual({ type: WebviewMessageType.CONFIG });
  });

  test("infoTable is empty after reload", async () => {
    expect(document.getElementById("info-table")?.innerHTML).toBe("");
  });

  test("player is empty after reload", async () => {
    expect(document.getElementById("player")?.innerHTML).toBe("");
  });

  test("analyzer is empty after reload", async () => {
    expect(document.getElementById("analyzer")?.innerHTML).toBe("");
  });
});

describe("webview error handling", () => {
  let webview: Webview;

  beforeAll(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterAll(() => {
    webview.dispose();
  });

  test("send error message", async () => {
    const readAudioInfo: () => void = () => {
      throw new Error("error in webview");
    };
    const createDecoder = async () => {
      return new Promise<Decoder>((resolve) => {
        resolve({
          numChannels: 1,
          sampleRate: 44100,
          fileSize: 500001,
          format: "s16",
          encoding: "pcm_s16le",
          duration: 1,
          samples: [new Float32Array(44100)],
          length: 44100,
          readAudioInfo: readAudioInfo,
          decode: () => {},
          dispose: () => {},
        } as Decoder);
      });
    };

    // init webview
    await waitVSCodeMessageForAction(() => {
      webview = new Webview(
        postMessageFromWebview,
        createAudioContext,
        createDecoder,
      );
    });
    // get config
    await waitVSCodeMessageForAction(() => {
      postMessageFromExt({
        type: ExtMessageType.CONFIG,
        data: {
          autoAnalyze: false,
          playerDefault: {
            volumeUnitDb: undefined,
            initialVolumeDb: 0.0,
            initialVolume: 1.0,
          },
          analyzeDefault: {
            waveformVisible: undefined,
            waveformVerticalScale: undefined,
            spectrogramVisible: undefined,
            spectrogramVerticalScale: undefined,
            windowSizeIndex: undefined,
            minAmplitude: undefined,
            maxAmplitude: undefined,
            minFrequency: undefined,
            maxFrequency: undefined,
            spectrogramAmplitudeRange: undefined,
            frequencyScale: undefined,
            melFilterNum: undefined,
          },
        },
      });
    });
    // get data
    await waitVSCodeMessageForAction(() => {
      postMessageFromExt({
        type: ExtMessageType.DATA,
        data: {
          start: 0,
          end: 500000,
          wholeLength: 500001,
          samples: new Uint8Array(500000),
        },
      });
    });
    // decode after receiving data
    const msg = await waitVSCodeMessageForAction(() => {
      postMessageFromExt({
        type: ExtMessageType.DATA,
        data: {
          start: 500000,
          end: 3500000,
          wholeLength: 500001,
          samples: new Uint8Array(1),
        },
      });
    });

    expect(msg).toEqual({
      type: WebviewMessageType.ERROR,
      data: { message: "error in webview" },
    });
  });
});

import { ExtMessageType, WebviewMessageType } from "../message";
import { EventType } from "../webview/events";
import Player from "../webview/ui/player";
import { createAudioContext, postMessageFromExt, postMessageFromWebview, receiveReaction, wait } from "./helper";

describe("player normal flow", () => {
    let player: Player;
    let audioContext = createAudioContext(44100);
    let audioBuffer = audioContext.createBuffer(2, 44100, 44100);

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        player.dispose();
        player = undefined;
    });

    test("init", () => {
        player = new Player("root", audioContext, audioBuffer, postMessageFromWebview);

        expect(document.getElementById("listen-button")).not.toBe(null);
    });

    test("request next data", async () => {
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.Data,
                data: {
                    samples: [[1,3,5,7],[0,2,4,6]],
                    length: 4,
                    numberOfChannels: 2,
                    start: 3,
                    end: 7,
                    wholeLength: 44100,
                    autoPlay: false,
                    autoAnalyze: false
                }
            });
        });

        expect(msg).toEqual({
            type: WebviewMessageType.Data,
            data: {
                start: 7, end: 7 + 100000
            }
        });
    });

    test("copy passed data to AudioBuffer", () => {
        const ch0d = audioBuffer.getChannelData(0).slice(0,10);
        const ch1d = audioBuffer.getChannelData(1).slice(0,10);
        expect(ch0d).toEqual(new Float32Array([0,0,0,1,3,5,7,0,0,0]));
        expect(ch1d).toEqual(new Float32Array([0,0,0,0,2,4,6,0,0,0]));
    });

    test("request next data", async () => {
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.Data,
                data: {
                    samples: [[1,3,5,7],[0,2,4,6]],
                    length: 4,
                    numberOfChannels: 2,
                    start: 34099,
                    end: 44099,
                    wholeLength: 44100,
                    autoPlay: false,
                    autoAnalyze: false
                }
            });
        });

        expect(msg).toEqual({
            type: WebviewMessageType.Data,
            data: {
                start: 44099, end: 44099 + 100000
            }
        });
    });

    test("don't send message after end", async () => {
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.Data,
                data: {
                    samples: [[1,3,5,7],[0,2,4,6]],
                    length: 4,
                    numberOfChannels: 2,
                    start: 34100,
                    end: 44100,
                    wholeLength: 44100,
                    autoPlay: false,
                }
            });
        }, 200);

        expect(msg).toEqual({
            type: WebviewMessageType.Error,
            data: {
                message: "Timeout"
            }
        });
    });

    test("player doesn't start playing automatically if autoPlay=false", () => {
        expect(player.isPlaying).toBe(false);
    });

    test("play button has text 'play'", () => {
        const button = document.getElementById("listen-button");
        expect(button.textContent).toBe("play");
    });

    test("play audio", () => {
        const button = document.getElementById("listen-button");
        button.click();
        expect(player.isPlaying).toBe(true);
    });

    test("play button has text 'stop'", () => {
        const button = document.getElementById("listen-button");
        expect(button.textContent).toBe("stop");
    });

    test("stop audio", async () => {
        const button = document.getElementById("listen-button");
        await wait(10);
        button.click();
        expect(player.isPlaying).toBe(false);
    });

    test("play audio from current sec", () => {
        expect(player.currentSec).toBeGreaterThanOrEqual(0.01);
    });

    test("user can seek audio with seekbar", async () => {
        const userInputeekbar = <HTMLInputElement>document.getElementById("user-input-seek-bar");
        userInputeekbar.value = "90";
        userInputeekbar.dispatchEvent(new InputEvent("change"));
        await wait(10);
        expect(player.currentSec).toBeGreaterThanOrEqual(0.90);
    });

    test("start playing after seek", () => {
        expect(player.isPlaying).toBe(true);
    });

    test("visible seek bar should move", async () => {
        const visibleSeekbar = <HTMLInputElement>document.getElementById("seek-bar");
        const value1 = Number(visibleSeekbar.value);
        await wait(11);
        const value2 = Number(visibleSeekbar.value);
        expect(value2).toBeGreaterThan(value1);
    });

    test("stop when finish playing", async () => {
        await wait(200);
        expect(player.isPlaying).toBe(false);
    });

    test("back seekbar is 100 after finish playing", async () => {
        await wait(50);
        const visibleSeekbar = <HTMLInputElement>document.getElementById("seek-bar");
        expect(Number(visibleSeekbar.value)).toBe(100);
    });

    test("back currentSec to 0 after finish playing", () => {
        expect(player.currentSec).toBe(0);
    });

    test("user can change volume by volumebar", async () => {
        const volumebar = <HTMLInputElement>document.getElementById("volume-bar");
        volumebar.value = "75";
        volumebar.dispatchEvent(new InputEvent("change"));
        await wait(10);
        expect(player.volume).toBeCloseTo(0.75);
    });

    test("seek by InputSeekbar Event", async () => {
        window.dispatchEvent(new CustomEvent(EventType.InputSeekbar, {
            detail: {
                value: 50
            }
        }));
        await wait(10);
        expect(player.currentSec).toBeGreaterThanOrEqual(0.5);
    });

    test("tick send UpdateSeekbar Event", (done) => {
        window.addEventListener(EventType.UpdateSeekbar, (e: CustomEvent) => {
            expect(e.detail.value).toBeGreaterThan(50);
            done();
        }, { once: true });
    });

    test("push play-button by space key", async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", {
            isComposing: false,
            code: "Space"
        }));
        await wait(10);
        expect(player.isPlaying).toBe(false);
    });
});

describe("player with autoPlay", () => {
    let player: Player;
    let audioContext = createAudioContext(44100);
    let audioBuffer = audioContext.createBuffer(2, 44100, 44100);

    beforeAll(() => {
        document.body.innerHTML = `<div id="root"></div>`;
    });

    afterAll(() => {
        player.dispose();
        player = undefined;
    });

    test("init", () => {
        player = new Player("root", audioContext, audioBuffer, postMessageFromWebview);

        expect(document.getElementById("listen-button")).not.toBe(null);
    });

    test("don't send message after end", async () => {
        const msg = await receiveReaction(() => {
            postMessageFromExt({
                type: ExtMessageType.Data,
                data: {
                    samples: [[1,3,5,7],[0,2,4,6]],
                    length: 4,
                    numberOfChannels: 2,
                    start: 34100,
                    end: 44100,
                    wholeLength: 44100,
                    autoPlay: true, // use autoPlay option
                }
            });
        }, 200);

        expect(msg).toEqual({
            type: WebviewMessageType.Error,
            data: {
                message: "Timeout"
            }
        });
    });

    test("start playing automatically if autoPlay=true", () => {
        expect(player.isPlaying).toBe(true);
    });
});
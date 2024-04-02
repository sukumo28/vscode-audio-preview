import { EventType } from "../../../webview/events";
import PlayerService from "../../../webview/service/playerService";
import PlayerComponent from "../../../webview/ui/playerComponent";
import { createAudioContext, waitEventForAction } from "../../helper";

describe('player', () => {
    let playerService: PlayerService;
    let playerComponent: PlayerComponent;
    beforeAll(() => {
        document.body.innerHTML = '<div id="player"></div>';
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
        playerService = new PlayerService(audioContext, audioBuffer);
        playerComponent = new PlayerComponent("player", playerService);
    });

    afterAll(() => {
        playerComponent.dispose();
        playerService.dispose();
    });

    test('player should have play button', () => {
        expect(document.getElementById('play-button')).toBeTruthy();
    });

    test('player should have volume bar', () => {
        expect(document.getElementById('volume-bar')).toBeTruthy();
        expect(document.getElementById('volume-text')).toBeTruthy();
    });

    test('player should have seek bar', () => {
        expect(document.getElementById('seek-bar')).toBeTruthy();
        expect(document.getElementById('user-input-seek-bar')).toBeTruthy();
        expect(document.getElementById('seek-pos-text')).toBeTruthy();
    });

    test('dispatch update-seekbar event when user change user-input-seek-bar', async () => {
        const detail = await waitEventForAction(() => {
            const userinputSeekbar = <HTMLInputElement>document.getElementById("user-input-seek-bar");
            userinputSeekbar.value = "50";
            userinputSeekbar.dispatchEvent(new Event('change'));
        }, window, EventType.UpdateSeekbar);
        expect(detail.value).toBeGreaterThanOrEqual(50);
    });

    test('update visible-seekbar when seekbar value is updated', () => {
        const visibleSeekbar = <HTMLInputElement>document.getElementById("seek-bar");
        window.dispatchEvent(new CustomEvent(EventType.UpdateSeekbar, {
            detail: {
                value: 50
            }
        }));
        expect(visibleSeekbar.value).toBe('50');
    });

    test('change volume when volume-bar is changed', () => {
        const volumeBar = <HTMLInputElement>document.getElementById("volume-bar");
        volumeBar.value = "0";
        volumeBar.dispatchEvent(new Event('input'));
        expect(playerService.volume).toBe(1.0);
        volumeBar.value = "-20";
        volumeBar.dispatchEvent(new Event('input'));
        expect(playerService.volume).toBe(0.1);
        volumeBar.value = "-80";
        volumeBar.dispatchEvent(new Event('input'));
        expect(playerService.volume).toBe(0.0);
    });

    test('play when play button is clicked while not playing', () => {
        if(playerService.isPlaying) playerService.pause();
        const playButton = <HTMLButtonElement>document.getElementById("play-button");
        playButton.dispatchEvent(new Event('click'));
        expect(playerService.isPlaying).toBe(true);
    });

    test('pause when play button is clicked while playing', () => {
        playerService.play();
        const playButton = <HTMLButtonElement>document.getElementById("play-button");
        playButton.dispatchEvent(new Event('click'));
        expect(playerService.isPlaying).toBe(false);
    });

    test('change text of play button when playing status is updated', () => {
        if(playerService.isPlaying) playerService.pause();
        const playButton = <HTMLButtonElement>document.getElementById("play-button");
        expect(playButton.textContent).toBe('play');
        playerService.play();
        expect(playButton.textContent).toBe('pause');
    });

    test('play when space key is pressed while not playing', () => {
        if(playerService.isPlaying) playerService.pause();
        window.dispatchEvent(new KeyboardEvent('keydown', { isComposing: false, code: 'Space' }));
        expect(playerService.isPlaying).toBe(true);
    });

});


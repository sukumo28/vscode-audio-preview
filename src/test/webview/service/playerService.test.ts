import { EventType } from '../../../webview/events';
import PlayerService from '../../../webview/service/playerService';
import { createAudioContext, waitEventForAction } from '../../helper';

describe('playerService', () => {
    let playerService: PlayerService;
    beforeAll(() => {
        const audioContext = createAudioContext(44100);
        const audioBuffer = audioContext.createBuffer(1, 44100 * 10, 44100);
        playerService = new PlayerService(audioContext, audioBuffer);
    });

    afterAll(() => {
        playerService.dispose();
    });

    test('play', async () => {
        const detail = await waitEventForAction(() => {
            playerService.play();
        }, window, EventType.UpdateIsPlaying);
    
        expect(detail.value).toBe(true);
    });

    test('tick', async () => {
        const detail = await waitEventForAction(() => {
            playerService.tick();
        }, window, EventType.UpdateSeekbar);
    
        expect(detail.value).toBeDefined();
    });

    test('pause', async () => {
        const detail = await waitEventForAction(() => {
            playerService.pause();
        }, window, EventType.UpdateIsPlaying);
    
        expect(detail.value).toBe(false);
    });
});

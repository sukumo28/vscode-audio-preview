import { EventType } from "../events";
import { createAudioContext, waitEventForAction } from "../../__mocks__/helper";
import PlayerService from "./playerService";
import { PlayerDefault } from "../../config";
import PlayerSettingsService from "./playerSettingsService";

describe("playerService", () => {
  let playerService: PlayerService;
  let playerSettingService: PlayerSettingsService;
  beforeAll(() => {
    const audioContext = createAudioContext(44100);
    const audioBuffer = audioContext.createBuffer(1, 44100 * 10, 44100);
    const pd = {} as PlayerDefault;
    playerSettingService = PlayerSettingsService.fromDefaultSetting(pd, audioBuffer);
    playerService = new PlayerService(audioContext, audioBuffer, playerSettingService);
  });

  afterAll(() => {
    playerService.dispose();
  });

  test("play", async () => {
    const detail = await waitEventForAction(
      () => {
        playerService.play();
      },
      playerService,
      EventType.UPDATE_IS_PLAYING,
    );

    expect(detail.value).toBe(true);
  });

  test("tick", async () => {
    const detail = await waitEventForAction(
      () => {
        playerService.tick();
      },
      playerService,
      EventType.UPDATE_SEEKBAR,
    );

    expect(detail.value).toBeDefined();
  });

  test("pause", async () => {
    const detail = await waitEventForAction(
      () => {
        playerService.pause();
      },
      playerService,
      EventType.UPDATE_IS_PLAYING,
    );

    expect(detail.value).toBe(false);
  });
});

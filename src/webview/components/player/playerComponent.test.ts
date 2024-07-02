import { EventType } from "../../events";
import {
  createAudioContext,
  waitEventForAction,
} from "../../../__mocks__/helper";
import PlayerService from "../../services/playerService";
import PlayerSettingsService from "../../services/playerSettingsService";
import PlayerComponent from "./playerComponent";

describe("playerComponent", () => {
  let playerService: PlayerService;
  let playerSettingService: PlayerSettingsService;
  let playerComponent: PlayerComponent;
  beforeAll(() => {
    document.body.innerHTML = '<div id="player"></div>';
    const audioContext = createAudioContext(44100);
    const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
    const pd = {
      volumeUnitDb: undefined,
      initialVolumeDb: 0.0,
      initialVolume: 1.0,
      enableSpacekeyPlay: true,
      enableSeekToPlay: true,
      enableHpf: false,
      hpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_HPF_DEFAULT,
      enableLpf: false,
      lpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_LPF_DEFAULT,
      matchFilterFrequencyToSpectrogram: false,
    };
    playerSettingService = PlayerSettingsService.fromDefaultSetting(
      pd,
      audioBuffer,
    );
    playerService = new PlayerService(
      audioContext,
      audioBuffer,
      playerSettingService,
    );
    playerComponent = new PlayerComponent(
      "#player",
      playerService,
      playerSettingService,
    );
  });

  afterAll(() => {
    playerComponent.dispose();
    playerService.dispose();
  });

  test("player should have play button", () => {
    expect(document.querySelector(".playButton")).toBeTruthy();
  });

  test("player should have volume bar", () => {
    expect(document.querySelector(".volumeBar")).toBeTruthy();
    expect(document.querySelector(".volumeText")).toBeTruthy();
  });

  test("player should have seek bar", () => {
    expect(document.querySelector(".seekBar")).toBeTruthy();
    expect(document.querySelector(".userInputSeekBar")).toBeTruthy();
    expect(document.querySelector(".seekPosText")).toBeTruthy();
  });

  test("dispatch update-seekbar event when user change user-input-seek-bar", async () => {
    const detail = await waitEventForAction(
      () => {
        const userinputSeekbar = <HTMLInputElement>(
          document.querySelector(".userInputSeekBar")
        );
        userinputSeekbar.value = "50";
        userinputSeekbar.dispatchEvent(new Event("change"));
      },
      playerService,
      EventType.UPDATE_SEEKBAR,
    );
    expect(detail.value).toBeGreaterThanOrEqual(50);
  });

  test("update visible-seekbar when seekbar value is updated", () => {
    const visibleSeekbar = <HTMLInputElement>document.querySelector(".seekBar");
    playerService.dispatchEvent(
      new CustomEvent(EventType.UPDATE_SEEKBAR, {
        detail: {
          value: 50,
        },
      }),
    );
    expect(visibleSeekbar.value).toBe("50");
  });

  test("change volume when volume-bar is changed (volumeUnitDb = false)", () => {
    const volumeBar = <HTMLInputElement>document.querySelector(".volumeBar");
    volumeBar.value = "100";
    volumeBar.dispatchEvent(new Event("input"));
    expect(playerService.volume).toBe(1.0);
    volumeBar.value = "50";
    volumeBar.dispatchEvent(new Event("input"));
    expect(playerService.volume).toBe(0.5);
    volumeBar.value = "0";
    volumeBar.dispatchEvent(new Event("input"));
    expect(playerService.volume).toBe(0.0);
  });

  test("change volume when volume-bar is changed (volumeUnitDb = true)", () => {
    const player2 = document.createElement("div");
    player2.id = "player2";
    document.body.appendChild(player2);
    console.log(document.body.innerHTML);
    const audioContext = createAudioContext(44100);
    const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
    const pd = {
      volumeUnitDb: true,
      initialVolumeDb: 0.0,
      initialVolume: 1.0,
      enableSpacekeyPlay: true,
      enableSeekToPlay: true,
      enableHpf: false,
      hpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_HPF_DEFAULT,
      enableLpf: false,
      lpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_LPF_DEFAULT,
      matchFilterFrequencyToSpectrogram: false,
    };
    const playerSettingService = PlayerSettingsService.fromDefaultSetting(
      pd,
      audioBuffer,
    );
    const playerService = new PlayerService(
      audioContext,
      audioBuffer,
      playerSettingService,
    );
    const playerComponent = new PlayerComponent(
      "#player2",
      playerService,
      playerSettingService,
    );

    const volumeBar = <HTMLInputElement>player2.querySelector(".volumeBar");
    volumeBar.value = "0";
    volumeBar.dispatchEvent(new Event("input"));
    expect(playerService.volume).toBe(1.0);
    volumeBar.value = "-20";
    volumeBar.dispatchEvent(new Event("input"));
    expect(playerService.volume).toBe(0.1);
    volumeBar.value = "-80";
    volumeBar.dispatchEvent(new Event("input"));
    expect(playerService.volume).toBe(0.0);

    playerService.dispose();
    playerComponent.dispose();
    document.body.removeChild(player2);
  });

  test("play when play button is clicked while not playing", () => {
    if (playerService.isPlaying) {
      playerService.pause();
    }
    const playButton = <HTMLButtonElement>document.querySelector(".playButton");
    playButton.dispatchEvent(new Event("click"));
    expect(playerService.isPlaying).toBe(true);
  });

  test("pause when play button is clicked while playing", () => {
    playerService.play();
    const playButton = <HTMLButtonElement>document.querySelector(".playButton");
    playButton.dispatchEvent(new Event("click"));
    expect(playerService.isPlaying).toBe(false);
  });

  test("change text of play button when playing status is updated", () => {
    if (playerService.isPlaying) {
      playerService.pause();
    }
    const playButton = <HTMLButtonElement>document.querySelector(".playButton");
    expect(playButton.textContent).toBe("play");
    playerService.play();
    expect(playButton.textContent).toBe("pause");
  });

  test("play when space key is pressed while not playing (enableSpacekeyPlay = true)", () => {
    if (playerService.isPlaying) {
      playerService.pause();
    }
    window.dispatchEvent(
      new KeyboardEvent("keydown", { isComposing: false, code: "Space" }),
    );
    expect(playerService.isPlaying).toBe(true);
  });

  test("do not play when space key is pressed while not playing (enableSpacekeyPlay = false)", () => {
    const player2 = document.createElement("div");
    player2.id = "player2";
    document.body.appendChild(player2);
    console.log(document.body.innerHTML);
    const audioContext = createAudioContext(44100);
    const audioBuffer = audioContext.createBuffer(2, 44100, 44100);
    const pd = {
      volumeUnitDb: true,
      initialVolumeDb: 0.0,
      initialVolume: 1.0,
      enableSpacekeyPlay: false,
      enableSeekToPlay: true,
      enableHpf: false,
      hpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_HPF_DEFAULT,
      enableLpf: false,
      lpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_LPF_DEFAULT,
      matchFilterFrequencyToSpectrogram: false,
    };
    const playerSettingService = PlayerSettingsService.fromDefaultSetting(
      pd,
      audioBuffer,
    );
    const playerService = new PlayerService(
      audioContext,
      audioBuffer,
      playerSettingService,
    );
    const playerComponent = new PlayerComponent(
      "#player2",
      playerService,
      playerSettingService,
    );

    window.dispatchEvent(
      new KeyboardEvent("keydown", { isComposing: false, code: "Space" }),
    );
    expect(playerService.isPlaying).toBe(false);

    playerService.dispose();
    playerComponent.dispose();
    document.body.removeChild(player2);
  });
});

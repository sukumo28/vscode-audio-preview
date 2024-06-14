import { createAudioContext } from "../../__mocks__/helper";
import { PlayerDefault } from "../../config";
import PlayerSettingsService from "./playerSettingsService";

describe("playerSettingsService", () => {
  let audioBuffer: AudioBuffer;
  let defaultSettings: PlayerDefault;
  beforeEach(() => {
    const audioContext = createAudioContext(44100);
    audioBuffer = audioContext.createBuffer(2, 44100, 44100);
    defaultSettings = {
      volumeUnitDb: undefined,
      initialVolumeDb: undefined,
      initialVolume: undefined,
      enableSpacekeyPlay: true,
      enableSeekToPlay: true,
      enableHpf: false,
      hpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_HPF_DEFAULT,
      enableLpf: false,
      lpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_LPF_DEFAULT,
      matchFilterFrequencyToSpectrogram: false,
    };
  });

  // volumeUnitDb
  test("volumeUnitDb should be false if no default value is provided", () => {
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.volumeUnitDb).toBe(false);
  });
  test("volumeUnitDb should be true if default value is true", () => {
    defaultSettings.volumeUnitDb = true;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.volumeUnitDb).toBe(true);
  });
  test("volumeUnitDb should be false if default value is false", () => {
    defaultSettings.volumeUnitDb = false;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.volumeUnitDb).toBe(false);
  });

  // initialVolumeDb
  test("initialVolumeDb should be 0.0 if no default value is provided", () => {
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolumeDb).toBe(0.0);
  });
  test("initialVolumeDb should be default value", () => {
    defaultSettings.initialVolumeDb = -20.0;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolumeDb).toBe(-20.0);
  });
  test("initialVolumeDb should be in valid range (check lower limit)", () => {
    defaultSettings.initialVolumeDb = -100.0;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolumeDb).toBe(PlayerSettingsService.VOLUME_DB_MAX);
  });
  test("initialVolumeDb should be in valid range (check upper limit)", () => {
    defaultSettings.initialVolumeDb = 10.0;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolumeDb).toBe(PlayerSettingsService.VOLUME_DB_MAX);
  });

  // initialVolume
  test("initialVolume should be 100 if no default value is provided", () => {
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolume).toBe(100);
  });
  test("initialVolume should be default value", () => {
    defaultSettings.initialVolume = 50;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolume).toBe(50);
  });
  test("initialVolume should be in valid range (check lower limit)", () => {
    defaultSettings.initialVolume = -10;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolume).toBe(PlayerSettingsService.VOLUME_MAX);
  });
  test("initialVolume should be in valid range (check upper limit)", () => {
    defaultSettings.initialVolume = 200;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.initialVolume).toBe(PlayerSettingsService.VOLUME_MAX);
  });

  // enableSpacekeyPlay
  test("enableSpacekeyPlay should be true if no default value is provided", () => {
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.enableSpacekeyPlay).toBe(true);
  });
  test("enableSpacekeyPlay should be true if default value is true", () => {
    defaultSettings.enableSpacekeyPlay = true;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.enableSpacekeyPlay).toBe(true);
  });
  test("enableSpacekeyPlay should be false if default value is false", () => {
    defaultSettings.enableSpacekeyPlay = false;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.enableSpacekeyPlay).toBe(false);
  });

  // enableSeekToPlay
  test("enableSeekToPlay should be true if no default value is provided", () => {
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.enableSeekToPlay).toBe(true);
  });
  test("enableSeekToPlay should be true if default value is true", () => {
    defaultSettings.enableSeekToPlay = true;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.enableSeekToPlay).toBe(true);
  });
  test("enableSeekToPlay should be false if default value is false", () => {
    defaultSettings.enableSeekToPlay = false;
    const ps = PlayerSettingsService.fromDefaultSetting(defaultSettings, audioBuffer);
    expect(ps.enableSeekToPlay).toBe(false);
  });
});

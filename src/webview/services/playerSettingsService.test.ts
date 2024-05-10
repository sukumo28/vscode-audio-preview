import { PlayerDefault } from "../../config";
import PlayerSettingService from "./playerSettingsService";

describe("playerSettingsService", () => {
  let defaultSettings: PlayerDefault;
  beforeEach(() => {
    defaultSettings = {
      volumeUnitDb: undefined,
      initialVolumeDb: undefined,
      initialVolume: undefined,
    };
  });

  // volumeUnitDb
  test("volumeUnitDb should be false if no default value is provided", () => {
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.volumeUnitDb).toBe(false);
  });
  test("volumeUnitDb should be true if default value is true", () => {
    defaultSettings.volumeUnitDb = true;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.volumeUnitDb).toBe(true);
  });
  test("volumeUnitDb should be false if default value is false", () => {
    defaultSettings.volumeUnitDb = false;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.volumeUnitDb).toBe(false);
  });

  // initialVolumeDb
  test("initialVolumeDb should be 0.0 if no default value is provided", () => {
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolumeDb).toBe(0.0);
  });
  test("initialVolumeDb should be default value", () => {
    defaultSettings.initialVolumeDb = -20.0;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolumeDb).toBe(-20.0);
  });
  test("initialVolumeDb should be in valid range (check lower limit)", () => {
    defaultSettings.initialVolumeDb = -100.0;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolumeDb).toBe(PlayerSettingService.VOLUME_DB_MAX);
  });
  test("initialVolumeDb should be in valid range (check upper limit)", () => {
    defaultSettings.initialVolumeDb = 10.0;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolumeDb).toBe(PlayerSettingService.VOLUME_DB_MAX);
  });

  // initialVolume
  test("initialVolume should be 100 if no default value is provided", () => {
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolume).toBe(100);
  });
  test("initialVolume should be default value", () => {
    defaultSettings.initialVolume = 50;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolume).toBe(50);
  });
  test("initialVolume should be in valid range (check lower limit)", () => {
    defaultSettings.initialVolume = -10;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolume).toBe(PlayerSettingService.VOLUME_MAX);
  });
  test("initialVolume should be in valid range (check upper limit)", () => {
    defaultSettings.initialVolume = 200;
    const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
    expect(ps.initialVolume).toBe(PlayerSettingService.VOLUME_MAX);
  });
});

import { PlayerDefault } from "../../../config";
import PlayerSettingService from "../../../webview/service/playerSettingsService";

describe("fromDefaultSettings", () => {
    let defaultSettings: PlayerDefault;
    beforeEach(() => {
        defaultSettings = { 
            volumeUnitDb: undefined,
            initVolumeDb: undefined,
            initVolume: undefined,
        };
    });

    // volumeUnitDb
    test("volumeUnitDb should be false if no default value is provided", () => {
        const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.volumeUnitDb).toBe(false);
    });
    test("volumeUnitDb should be default value (true case)", () => {
        defaultSettings.volumeUnitDb = true;
        const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.volumeUnitDb).toBe(true);
    });
    test("volumeUnitDb should be default value (false case)", () => {
        defaultSettings.volumeUnitDb = false;
        const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.volumeUnitDb).toBe(false);
    });

    // initVolumeDb
    test("initVolumeDb should be 0.0 if no default value is provided", () => {
        const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolumeDb).toBe(0.0);
    });
    test("initVolumeDb should be default value", () => {
        defaultSettings.initVolumeDb = -20.0;
        let ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolumeDb).toBe(-20.0);
    });
    test("initVolumeDb should be in valid range", () => {
        defaultSettings.initVolumeDb = -100.0;
        let ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolumeDb).toBe(PlayerSettingService.VOLUME_DB_MIN);

        defaultSettings.initVolumeDb = 10.0;
        ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolumeDb).toBe(PlayerSettingService.VOLUME_DB_MAX);
    });

    // initVolume
    test("initVolume should be 100 if no default value is provided", () => {
        const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolume).toBe(100);
    });
    test("initVolume should be default value", () => {
        defaultSettings.initVolume = 50;
        let ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolume).toBe(50);
    });
    test("initVolume should be in valid range", () => {
        defaultSettings.initVolume = -10;
        let ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolume).toBe(PlayerSettingService.VOLUME_MIN);

        defaultSettings.initVolume = 200;
        ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.initVolume).toBe(PlayerSettingService.VOLUME_MAX);
    });
});

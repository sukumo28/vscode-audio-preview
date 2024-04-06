import { PlayerDefault } from "../../../config";
import PlayerSettingService from "../../../webview/service/playerSettingsService";

describe("fromDefaultSettings", () => {
    let defaultSettings: PlayerDefault;
    beforeEach(() => {
        defaultSettings = { 
            volumeUnitDb: undefined
        };
    });

    // windowSizeIndex
    test("volumeUnitDb should be true if no default value is provided", () => {
        const ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.volumeUnitDb).toBe(true);
    });
    test("volumeUnitDb should be default value", () => {
        defaultSettings.volumeUnitDb = true;
        let ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.volumeUnitDb).toBe(true);

        defaultSettings.volumeUnitDb = false;
        ps = PlayerSettingService.fromDefaultSetting(defaultSettings);
        expect(ps.volumeUnitDb).toBe(false);
    });
});

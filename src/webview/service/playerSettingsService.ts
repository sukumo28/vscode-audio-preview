import { PlayerDefault } from "../../config";

export default class PlayerSettingsService {
    private _volumeUnitDb: boolean;
    public get volumeUnitDb() { return this._volumeUnitDb; }
    public set volumeUnitDb(value: boolean) { 
        this._volumeUnitDb = value == undefined ? true : value;      // true by default
    }

    private constructor(volumeUnitDb: boolean) {
        this._volumeUnitDb = volumeUnitDb;
    }

    public static fromDefaultSetting(defaultSetting: PlayerDefault) {
        // create instance
        const setting = new PlayerSettingsService(true);

        // init volume unit
        setting.volumeUnitDb = defaultSetting.volumeUnitDb;

        return setting;
    }
}

import { PlayerDefault } from "../../config";
import { getValueInRange } from "../../util";

export default class PlayerSettingsService {
    public static VOLUME_DB_MAX = 0.0;
    public static VOLUME_DB_MIN = -80.0;
    public static VOLUME_MAX = 100;
    public static VOLUME_MIN = 0;

    private _volumeUnitDb: boolean;
    public get volumeUnitDb() { return this._volumeUnitDb; }
    public set volumeUnitDb(value: boolean) { 
        this._volumeUnitDb = value == undefined ? false : value;      // false by default
    }

    private _initVolumeDb: number;
    public get initVolumeDb() { return this._initVolumeDb; }
    public set initVolumeDb(value: number) { 
        this._initVolumeDb = getValueInRange(
            value,
            PlayerSettingsService.VOLUME_DB_MIN,
            PlayerSettingsService.VOLUME_DB_MAX,
            PlayerSettingsService.VOLUME_DB_MAX
        );
    }

    private _initVolume: number;
    public get initVolume() { return this._initVolume; }
    public set initVolume(value: number) { 
        this._initVolume = getValueInRange(
            value,
            PlayerSettingsService.VOLUME_MIN,
            PlayerSettingsService.VOLUME_MAX,
            PlayerSettingsService.VOLUME_MAX
        );
    }

    private constructor(volumeUnitDb: boolean, initVolumeDb: number, initVolume: number) {
        this._volumeUnitDb = volumeUnitDb;
        this._initVolumeDb = initVolumeDb;
        this._initVolume = initVolume;
    }

    public static fromDefaultSetting(defaultSetting: PlayerDefault) {
        // create instance
        const setting = new PlayerSettingsService(true, 0.0, 1.0);

        // init volume unit
        setting.volumeUnitDb = defaultSetting.volumeUnitDb;

        // init initial volume
        setting.initVolumeDb = defaultSetting.initVolumeDb;
        setting.initVolume = defaultSetting.initVolume;

        return setting;
    }
}

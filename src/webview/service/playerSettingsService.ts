import { PlayerDefault } from "../../config";

export default class PlayerSettingsService {
    public static VOLUME_DB_MAX = 0.0;
    public static VOLUME_DB_MIN = -80.0;
    public static VOLUME_MAX = 100;
    public static VOLUME_MIN = 0;

    private _volumeUnitDb: boolean;
    public get volumeUnitDb() { return this._volumeUnitDb; }
    public set volumeUnitDb(value: boolean) { 
        this._volumeUnitDb = value == undefined ? true : value;      // true by default
    }

    private _initVolumeDb: number;
    public get initVolumeDb() { return this._initVolumeDb; }
    public set initVolumeDb(value: number) { 
        let val = value == undefined ? PlayerSettingsService.VOLUME_DB_MAX : value;      // max by default

        if (val < PlayerSettingsService.VOLUME_DB_MIN) val = PlayerSettingsService.VOLUME_DB_MIN;
        if (PlayerSettingsService.VOLUME_DB_MAX < val) val = PlayerSettingsService.VOLUME_DB_MAX; 
        this._initVolumeDb = val;
    }

    private _initVolume: number;
    public get initVolume() { return this._initVolume; }
    public set initVolume(value: number) { 
        let val = value == undefined ? PlayerSettingsService.VOLUME_MAX : value;      // max by default

        if (val < PlayerSettingsService.VOLUME_MIN) val = PlayerSettingsService.VOLUME_MIN;
        if (PlayerSettingsService.VOLUME_MAX < val) val = PlayerSettingsService.VOLUME_MAX; 
        this._initVolume = val;
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

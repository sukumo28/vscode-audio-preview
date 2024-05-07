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

    private _initialVolumeDb: number;
    public get initialVolumeDb() { return this._initialVolumeDb; }
    public set initialVolumeDb(value: number) { 
        this._initialVolumeDb = getValueInRange(
            value,
            PlayerSettingsService.VOLUME_DB_MIN,
            PlayerSettingsService.VOLUME_DB_MAX,
            PlayerSettingsService.VOLUME_DB_MAX
        );
    }

    private _initialVolume: number;
    public get initialVolume() { return this._initialVolume; }
    public set initialVolume(value: number) { 
        this._initialVolume = getValueInRange(
            value,
            PlayerSettingsService.VOLUME_MIN,
            PlayerSettingsService.VOLUME_MAX,
            PlayerSettingsService.VOLUME_MAX
        );
    }

    private constructor(volumeUnitDb: boolean, initialVolumeDb: number, initialVolume: number) {
        this._volumeUnitDb = volumeUnitDb;
        this._initialVolumeDb = initialVolumeDb;
        this._initialVolume = initialVolume;
    }

    public static fromDefaultSetting(defaultSetting: PlayerDefault) {
        // create instance
        const setting = new PlayerSettingsService(true, 0.0, 1.0);

        // init volume unit
        setting.volumeUnitDb = defaultSetting.volumeUnitDb;

        // init initial volume
        setting.initialVolumeDb = defaultSetting.initialVolumeDb;
        setting.initialVolume = defaultSetting.initialVolume;

        return setting;
    }
}

import { PlayerDefault } from "../../config";
import { getValueInRange } from "../../util";
import Service from "../service";

export default class PlayerSettingsService extends Service{
  public static readonly VOLUME_DB_MAX = 0.0;
  public static readonly VOLUME_DB_MIN = -80.0;
  public static readonly VOLUME_MAX = 100;
  public static readonly VOLUME_MIN = 0;
  public static readonly FILTER_FREQUENCY_MAX = 100000;
  public static readonly FILTER_FREQUENCY_MIN = 1;
  public static readonly FILTER_FREQUENCY_HPF_DEFAULT = 100;
  public static readonly FILTER_FREQUENCY_LPF_DEFAULT = 10000;

  private _volumeUnitDb: boolean;
  public get volumeUnitDb() {
    return this._volumeUnitDb;
  }
  public set volumeUnitDb(value: boolean) {
    this._volumeUnitDb = value === undefined ? false : value; // false by default
  }

  private _initialVolumeDb: number;
  public get initialVolumeDb() {
    return this._initialVolumeDb;
  }
  public set initialVolumeDb(value: number) {
    this._initialVolumeDb = getValueInRange(
      value,
      PlayerSettingsService.VOLUME_DB_MIN,
      PlayerSettingsService.VOLUME_DB_MAX,
      PlayerSettingsService.VOLUME_DB_MAX,
    );
  }

  private _initialVolume: number;
  public get initialVolume() {
    return this._initialVolume;
  }
  public set initialVolume(value: number) {
    this._initialVolume = getValueInRange(
      value,
      PlayerSettingsService.VOLUME_MIN,
      PlayerSettingsService.VOLUME_MAX,
      PlayerSettingsService.VOLUME_MAX,
    );
  }

  private _enableSpacekeyPlay: boolean;
  public get enableSpacekeyPlay() {
    return this._enableSpacekeyPlay;
  }
  public set enableSpacekeyPlay(value: boolean) {
    this._enableSpacekeyPlay = value === undefined ? true : value; // true by default
  }

  private _enableSeekToPlay: boolean;
  public get enableSeekToPlay() {
    return this._enableSeekToPlay;
  }
  public set enableSeekToPlay(value: boolean) {
    this._enableSeekToPlay = value === undefined ? true : value; // true by default
  }

  private _enableHpf: boolean;
  public get enableHpf() {
    return this._enableHpf;
  }
  public set enableHpf(value: boolean) {
    this._enableHpf = value === undefined ? false : value; // false by default
  }

  private _hpfFrequency: number;
  public get hpfFrequency() {
    return this._hpfFrequency;
  }
  public set hpfFrequency(value: number) {
    this._hpfFrequency = getValueInRange(
      value,
      PlayerSettingsService.FILTER_FREQUENCY_MIN,
      PlayerSettingsService.FILTER_FREQUENCY_MAX,
      PlayerSettingsService.FILTER_FREQUENCY_HPF_DEFAULT,
    );
  }

  private _enableLpf: boolean;
  public get enableLpf() {
    return this._enableLpf;
  }
  public set enableLpf(value: boolean) {
    this._enableLpf = value === undefined ? false : value; // false by default
  }

  private _lpfFrequency: number;
  public get lpfFrequency() {
    return this._lpfFrequency;
  }
  public set lpfFrequency(value: number) {
    this._lpfFrequency = getValueInRange(
      value,
      PlayerSettingsService.FILTER_FREQUENCY_MIN,
      PlayerSettingsService.FILTER_FREQUENCY_MAX,
      PlayerSettingsService.FILTER_FREQUENCY_LPF_DEFAULT,
    );
  }

  private _matchFilterFrequencyToSpectrogram: boolean;
  public get matchFilterFrequencyToSpectrogram() {
    return this._matchFilterFrequencyToSpectrogram;
  }
  public set matchFilterFrequencyToSpectrogram(value: boolean) {
    this._matchFilterFrequencyToSpectrogram = value === undefined ? false : value; // false by default
  }

  private constructor(
    volumeUnitDb: boolean,
    initialVolumeDb: number,
    initialVolume: number,
    enableSpacekeyPlay: boolean,
    enableSeekToPlay: boolean,
    enableHpf: boolean,
    hpfFrequency: number,
    enableLpf: boolean,
    lpfFrequency: number,
    matchFilterFrequencyToSpectrogram: boolean,
  ) {
    super();
    this._volumeUnitDb = volumeUnitDb;
    this._initialVolumeDb = initialVolumeDb;
    this._initialVolume = initialVolume;
    this._enableSpacekeyPlay = enableSpacekeyPlay;
    this._enableSeekToPlay = enableSeekToPlay;
    this._enableHpf = enableHpf;
    this._hpfFrequency = hpfFrequency;
    this._enableLpf = enableLpf;
    this._lpfFrequency = lpfFrequency;
    this._matchFilterFrequencyToSpectrogram = matchFilterFrequencyToSpectrogram;
  }

  public static fromDefaultSetting(defaultSetting: PlayerDefault) {
    // create instance
    const setting = new PlayerSettingsService(true, 0.0, 1.0, true, true,
                                              false, this.FILTER_FREQUENCY_HPF_DEFAULT,
                                              false, this.FILTER_FREQUENCY_LPF_DEFAULT, false);

    // init volume unit
    setting.volumeUnitDb = defaultSetting.volumeUnitDb;

    // init initial volume
    setting.initialVolumeDb = defaultSetting.initialVolumeDb;
    setting.initialVolume = defaultSetting.initialVolume;

    // init space key play
    setting.enableSpacekeyPlay = defaultSetting.enableSpacekeyPlay;

    // init seek to play
    setting.enableSeekToPlay = defaultSetting.enableSeekToPlay;

    // init filters
    setting.enableHpf = defaultSetting.enableHpf;
    setting.hpfFrequency = defaultSetting.hpfFrequency;
    setting.enableLpf = defaultSetting.enableLpf;
    setting.lpfFrequency = defaultSetting.lpfFrequency;
    setting.matchFilterFrequencyToSpectrogram = defaultSetting.matchFilterFrequencyToSpectrogram;

    return setting;
  }
}

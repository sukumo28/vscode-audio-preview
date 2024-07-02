import { EventType } from "../events";
import Service from "../service";
import PlayerSettingsService from "./playerSettingsService";

export default class PlayerService extends Service {
  private _audioContext: AudioContext;
  private _audioBuffer: AudioBuffer;
  private _playerSettingsService: PlayerSettingsService;

  private _isPlaying: boolean = false;
  private _lastStartAcTime: number = 0;
  private _currentSec: number = 0;
  private _source: AudioBufferSourceNode;

  public get isPlaying() {
    return this._isPlaying;
  }
  public get currentSec() {
    return this._currentSec;
  }

  private _gainNode: GainNode;
  // volume is 0~1
  public get volume() {
    if (!this._gainNode) {
      return 1;
    }
    return this._gainNode.gain.value;
  }
  public set volume(value: number) {
    if (!this._gainNode) {
      return;
    }
    this._gainNode.gain.value = value;
  }

  private _hpfNode: BiquadFilterNode;
  private _lpfNode: BiquadFilterNode;

  private _seekbarValue: number = 0;
  private _animationFrameID: number = 0;

  constructor(
    audioContext: AudioContext,
    audioBuffer: AudioBuffer,
    playerSettingsService: PlayerSettingsService,
  ) {
    super();
    this._audioContext = audioContext;
    this._audioBuffer = audioBuffer;
    this._playerSettingsService = playerSettingsService;

    // init volume
    this._gainNode = this._audioContext.createGain();
    this._gainNode.connect(this._audioContext.destination);

    // init high-pass filter
    this._hpfNode = this._audioContext.createBiquadFilter();
    this._hpfNode.type = "highpass";
    this._hpfNode.Q.value = Math.SQRT1_2; // butterworth

    // init high-pass filter
    this._lpfNode = this._audioContext.createBiquadFilter();
    this._lpfNode.type = "lowpass";
    this._lpfNode.Q.value = Math.SQRT1_2; // butterworth

    // play again if filter related setting is changed
    const applyFilters = () => {
      if (this._isPlaying) {
        this.pause();
        this.play();
      }
    };
    this._playerSettingsService.addEventListener(EventType.PS_UPDATE_ENABLE_HPF, applyFilters);
    this._playerSettingsService.addEventListener(EventType.PS_UPDATE_HPF_FREQUENCY, applyFilters);
    this._playerSettingsService.addEventListener(EventType.PS_UPDATE_ENABLE_LPF, applyFilters);
    this._playerSettingsService.addEventListener(EventType.PS_UPDATE_LPF_FREQUENCY, applyFilters);
  }

  public play() {
    // connect nodes
    let lastNode = this._gainNode;

    this._lpfNode.disconnect();
    if (this._playerSettingsService.enableLpf) {
      this._lpfNode.frequency.value = this._playerSettingsService.lpfFrequency;
      this._lpfNode.connect(lastNode);
      lastNode = this._lpfNode;
    }

    this._hpfNode.disconnect();
    if (this._playerSettingsService.enableHpf) {
      this._hpfNode.frequency.value = this._playerSettingsService.hpfFrequency;
      this._hpfNode.connect(lastNode);
      lastNode = this._hpfNode;
    }

    // create audioBufferSourceNode every time,
    // because audioBufferSourceNode.start() can't be called more than once.
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
    this._source = this._audioContext.createBufferSource();
    this._source.buffer = this._audioBuffer;
    this._source.connect(lastNode);

    // play
    this._isPlaying = true;
    this._lastStartAcTime = this._audioContext.currentTime;
    this._source.start(this._audioContext.currentTime, this._currentSec);

    // update playing status
    this.dispatchEvent(
      new CustomEvent(EventType.UPDATE_IS_PLAYING, {
        detail: {
          value: this._isPlaying,
        },
      }),
    );

    // move seek bar
    this._animationFrameID = requestAnimationFrame(() => this.tick());
  }

  public pause() {
    // stop seek bar
    cancelAnimationFrame(this._animationFrameID);

    // pause
    this._source.stop();
    this._currentSec += this._audioContext.currentTime - this._lastStartAcTime;
    this._isPlaying = false;
    this._source = undefined;

    // update playing status
    this.dispatchEvent(
      new CustomEvent(EventType.UPDATE_IS_PLAYING, {
        detail: {
          value: this._isPlaying,
        },
      }),
    );
  }

  public tick() {
    const current =
      this._currentSec + this._audioContext.currentTime - this._lastStartAcTime;
    this._seekbarValue = (100 * current) / this._audioBuffer.duration;

    // update seek bar value
    this.dispatchEvent(
      new CustomEvent(EventType.UPDATE_SEEKBAR, {
        detail: {
          value: this._seekbarValue,
          pos: current,
        },
      }),
    );

    // pause if finish playing
    if (current > this._audioBuffer.duration) {
      this.pause();
      // reset current time
      this._currentSec = 0;
      this._seekbarValue = 0;
      return;
    }

    if (this._isPlaying) {
      this._animationFrameID = requestAnimationFrame(() => this.tick());
    }
  }

  // seekbar value is 0~100
  public onSeekbarInput(value: number) {
    const resumeRequired = this._isPlaying;

    if (this._isPlaying) {
      this.pause();
    }

    // update seek bar value
    this._currentSec = (value * this._audioBuffer.duration) / 100;
    this._seekbarValue = value;
    this.dispatchEvent(
      new CustomEvent(EventType.UPDATE_SEEKBAR, {
        detail: {
          value: this._seekbarValue,
          pos: this._currentSec,
        },
      }),
    );

    // restart from selected place
    if (resumeRequired || this._playerSettingsService.enableSeekToPlay) {
      this.play();
    }
  }
}

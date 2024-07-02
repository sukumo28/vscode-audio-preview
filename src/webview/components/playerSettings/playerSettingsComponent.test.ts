import { createAudioContext, getRandomFloat } from "../../../__mocks__/helper";
import { EventType } from "../../events";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";
import PlayerSettingsService from "../../services/playerSettingsService";
import PlayerSettingsComponent from "./playerSettingsComponent";

describe("playerSettingsComponent", () => {
  let audioBuffer: AudioBuffer;
  let analyzeService: AnalyzeService;
  let analyzeSettingsService: AnalyzeSettingsService;
  let playerSettingsService: PlayerSettingsService;
  let playerSettingsComponent: PlayerSettingsComponent;
  beforeAll(() => {
    document.body.innerHTML = '<div id="playerSettings"></div>';
    const audioContext = createAudioContext(44100);
    audioBuffer = audioContext.createBuffer(2, 44100, 44100);
    const ad = {
      waveformVisible: undefined,
      waveformVerticalScale: undefined,
      spectrogramVisible: undefined,
      spectrogramVerticalScale: undefined,
      windowSizeIndex: undefined,
      minAmplitude: undefined,
      maxAmplitude: undefined,
      minFrequency: undefined,
      maxFrequency: undefined,
      spectrogramAmplitudeRange: undefined,
      frequencyScale: undefined,
      melFilterNum: undefined,
    };
    analyzeService = new AnalyzeService(audioBuffer);
    analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(
      ad,
      audioBuffer,
    );
    const pd = {
      volumeUnitDb: true,
      initialVolumeDb: 0.0,
      initialVolume: 1.0,
      enableSpacekeyPlay: true,
      enableSeekToPlay: true,
      enableHpf: false,
      hpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_HPF_DEFAULT,
      enableLpf: false,
      lpfFrequency: PlayerSettingsService.FILTER_FREQUENCY_LPF_DEFAULT,
      matchFilterFrequencyToSpectrogram: false,
    };
    playerSettingsService = PlayerSettingsService.fromDefaultSetting(
      pd,
      audioBuffer,
    );
    playerSettingsComponent = new PlayerSettingsComponent(
      "#playerSettings",
      playerSettingsService,
      analyzeService,
      analyzeSettingsService,
    );
  });

  afterAll(() => {
    analyzeService.dispose();
    analyzeSettingsService.dispose();
    playerSettingsComponent.dispose();
  });

  test("enable-hpf should be updated when user change enable-hpf-input", () => {
    const enableHpf = document.querySelector(".js-playerSetting-enableHpf") as HTMLInputElement;
    enableHpf.checked = true;
    enableHpf.dispatchEvent(new Event(EventType.CHANGE));
    expect(playerSettingsService.enableHpf).toBe(true);

    enableHpf.checked = false;
    enableHpf.dispatchEvent(new Event(EventType.CHANGE));
    expect(playerSettingsService.enableHpf).toBe(false);
  });
  test("enable-hpf should be updated when recieving update-enable-hpf event", () => {
    playerSettingsService.dispatchEvent(
      new CustomEvent(EventType.PS_UPDATE_ENABLE_HPF, {
        detail: {
          value: true,
        },
      }),
    );
    const enableHpf = document.querySelector(".js-playerSetting-enableHpf") as HTMLInputElement;
    expect(enableHpf.checked).toBe(true);

    playerSettingsService.dispatchEvent(
      new CustomEvent(EventType.PS_UPDATE_ENABLE_HPF, {
        detail: {
          value: false,
        },
      }),
    );
    expect(enableHpf.checked).toBe(false);
  });

  test("hpf-frequency should be updated when user change hpf-frequency-input", () => {
    const hpfFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
    const hpfFrequencyInput = document.querySelector(".js-playerSetting-hpfFrequency") as HTMLInputElement;
    hpfFrequencyInput.value = hpfFrequency.toString();
    hpfFrequencyInput.dispatchEvent(new Event(EventType.INPUT));
    expect(playerSettingsService.hpfFrequency).toBeCloseTo(hpfFrequency);
  });
  test("hpf-frequency-input should be updated when recieving update-hpf-frequency event", () => {
    const hpfFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
    playerSettingsService.dispatchEvent(
      new CustomEvent(EventType.PS_UPDATE_HPF_FREQUENCY, {
        detail: {
          value: hpfFrequency,
        },
      }),
    );
    const hpfFrequencyInput = document.querySelector(".js-playerSetting-hpfFrequency") as HTMLInputElement;
    expect(Number(hpfFrequencyInput.value)).toBeCloseTo(hpfFrequency);
  });

  test("enable-lpf should be updated when user change enable-lpf-input", () => {
    const enableLpf = document.querySelector(".js-playerSetting-enableLpf") as HTMLInputElement;
    enableLpf.checked = true;
    enableLpf.dispatchEvent(new Event(EventType.CHANGE));
    expect(playerSettingsService.enableLpf).toBe(true);

    enableLpf.checked = false;
    enableLpf.dispatchEvent(new Event(EventType.CHANGE));
    expect(playerSettingsService.enableLpf).toBe(false);
  });
  test("enable-lpf should be updated when recieving update-enable-lpf event", () => {
    playerSettingsService.dispatchEvent(
      new CustomEvent(EventType.PS_UPDATE_ENABLE_LPF, {
        detail: {
          value: true,
        },
      }),
    );
    const enableLpf = document.querySelector(".js-playerSetting-enableLpf") as HTMLInputElement;
    expect(enableLpf.checked).toBe(true);

    playerSettingsService.dispatchEvent(
      new CustomEvent(EventType.PS_UPDATE_ENABLE_LPF, {
        detail: {
          value: false,
        },
      }),
    );
    expect(enableLpf.checked).toBe(false);
  });

  test("lpf-frequency should be updated when user change lpf-frequency-input", () => {
    const lpfFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
    const lpfFrequencyInput = document.querySelector(".js-playerSetting-lpfFrequency") as HTMLInputElement;
    lpfFrequencyInput.value = lpfFrequency.toString();
    lpfFrequencyInput.dispatchEvent(new Event(EventType.INPUT));
    expect(playerSettingsService.lpfFrequency).toBeCloseTo(lpfFrequency);
  });
  test("lpf-frequency-input should be updated when recieving update-lpf-frequency event", () => {
    const lpfFrequency = getRandomFloat(0, audioBuffer.sampleRate / 2);
    playerSettingsService.dispatchEvent(
      new CustomEvent(EventType.PS_UPDATE_LPF_FREQUENCY, {
        detail: {
          value: lpfFrequency,
        },
      }),
    );
    const lpfFrequencyInput = document.querySelector(".js-playerSetting-lpfFrequency") as HTMLInputElement;
    expect(Number(lpfFrequencyInput.value)).toBeCloseTo(lpfFrequency);
  });

  test("match-filter-frequency-to-spectrogram should be updated when user change match-filter-frequency-to-spectrogram-input", () => {
    const matchFilterFrequencyToSpectrogram =
      document.querySelector(
        ".js-playerSetting-matchFilterFrequencyToSpectrogram",
      ) as HTMLInputElement;
    matchFilterFrequencyToSpectrogram.checked = true;
    matchFilterFrequencyToSpectrogram.dispatchEvent(
      new Event(EventType.CHANGE),
    );
    expect(playerSettingsService.matchFilterFrequencyToSpectrogram).toBe(true);

    matchFilterFrequencyToSpectrogram.checked = false;
    matchFilterFrequencyToSpectrogram.dispatchEvent(
      new Event(EventType.CHANGE),
    );
    expect(playerSettingsService.matchFilterFrequencyToSpectrogram).toBe(false);
  });
  test("match-filter-frequency-to-spectrogram should be updated when recieving update-match-filter-frequency-to-spectrogram event", () => {
    playerSettingsService.dispatchEvent(
      new CustomEvent(
        EventType.PS_UPDATE_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM,
        {
          detail: {
            value: true,
          },
        },
      ),
    );
    const matchFilterFrequencyToSpectrogram =
      document.querySelector(
        ".js-playerSetting-matchFilterFrequencyToSpectrogram",
      ) as HTMLInputElement;
    expect(matchFilterFrequencyToSpectrogram.checked).toBe(true);

    playerSettingsService.dispatchEvent(
      new CustomEvent(
        EventType.PS_UPDATE_MATCH_FILTER_FREQUENCY_TO_SPECTROGRAM,
        {
          detail: {
            value: false,
          },
        },
      ),
    );
    expect(matchFilterFrequencyToSpectrogram.checked).toBe(false);
  });
});

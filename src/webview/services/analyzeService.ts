import Ooura from "ooura";
import { EventType } from "../events";
import { AnalyzeSettingsProps } from "./analyzeSettingsService";
import Service from "../service";

export default class AnalyzeService extends Service {
  private _audioBuffer: AudioBuffer;

  constructor(audioBuffer: AudioBuffer) {
    super();
    this._audioBuffer = audioBuffer;
  }

  // round input value to the nearest nice number, which has the most significant digit of 1, 2, 5
  // return the number of decimal digits as well, for display purpose
  public static roundToNearestNiceNumber(input: number): [number, number] {
    const niceNumbers = [1.0, 2.0, 5.0, 10.0];

    if (input <= 0) {
      return [0, 0];
    } // this function only works for positive number

    // input = mantissa * 10^exponent
    const exponent = Math.floor(Math.log10(input));
    const mantissa = input / Math.pow(10, exponent);

    // find which number in niceNumbers is nearest
    const dist: number[] = niceNumbers.map((value) =>
      Math.abs(Math.log10(mantissa) - Math.log10(value)),
    );
    const niceNumber = niceNumbers[dist.indexOf(Math.min(...dist))];

    const rounded = niceNumber * Math.pow(10, exponent);
    let digit = niceNumber === 10.0 ? -exponent - 1 : -exponent;
    digit = digit <= 0 ? 0 : digit; // avoid -0

    return [rounded, digit];
  }

  public getSpectrogramColor(amp: number, range: number): string {
    if (amp === null) {
      return "rgb(0,0,0)";
    }
    const classNum = 6;
    const classWidth = range / classNum;
    const ampClass = Math.floor(amp / classWidth);
    const classMinAmp = (ampClass + 1) * classWidth;
    const value = (amp - classMinAmp) / -classWidth;
    switch (ampClass) {
      case 0:
        return `rgb(255,255,${125 + Math.floor(value * 130)})`;
      case 1:
        return `rgb(255,${125 + Math.floor(value * 130)},125)`;
      case 2:
        return `rgb(255,${Math.floor(value * 125)},125)`;
      case 3:
        return `rgb(${125 + Math.floor(value * 130)},0,125)`;
      case 4:
        return `rgb(${Math.floor(value * 125)},0,125)`;
      case 5:
        return `rgb(0,0,${Math.floor(value * 125)})`;
      default:
        return `rgb(0,0,0)`;
    }
  }

  public analyze() {
    this.dispatchEvent(new CustomEvent(EventType.ANALYZE));
  }

  public getSpectrogram(ch: number, settings: AnalyzeSettingsProps) {
    const data = this._audioBuffer.getChannelData(ch);
    const sampleRate = this._audioBuffer.sampleRate;

    const windowSize = settings.windowSize;
    const window = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / windowSize);
    }

    const startIndex = Math.floor(settings.minTime * sampleRate);
    const endIndex = Math.floor(settings.maxTime * sampleRate);

    const df = sampleRate / settings.windowSize;
    const minFreqIndex = Math.floor(settings.minFrequency / df);
    const maxFreqIndex = Math.floor(settings.maxFrequency / df);

    const ooura = new Ooura(windowSize, { type: "real", radix: 4 });

    let maxValue = Number.EPSILON;

    const spectrogram: number[][] = [];
    for (let i = startIndex; i < endIndex; i += settings.hopSize) {
      // i is center of the window
      const s = i - windowSize / 2,
        t = i + windowSize / 2;
      const ss = s > 0 ? s : 0,
        tt = t < data.length ? t : data.length;
      const d = ooura.scalarArrayFactory();
      for (let j = 0; j < d.length; j++) {
        if (s + j < ss) {
          continue;
        }
        if (tt < s + j) {
          continue;
        }
        d[j] = data[s + j] * window[j];
      }

      const re = ooura.vectorArrayFactory();
      const im = ooura.vectorArrayFactory();
      ooura.fft(d.buffer, re.buffer, im.buffer);

      const ps: number[] = [];
      for (let j = minFreqIndex; j < maxFreqIndex; j++) {
        const v = re[j] * re[j] + im[j] * im[j];
        ps.push(v);
        if (maxValue < v) {
          maxValue = v;
        }
      }

      spectrogram.push(ps);
    }

    for (let i = 0; i < spectrogram.length; i++) {
      for (let j = 0; j < spectrogram[i].length; j++) {
        spectrogram[i][j] = 10 * Math.log10(spectrogram[i][j] / maxValue);
      }
    }

    return spectrogram;
  }

  public getMelSpectrogram(ch: number, settings: AnalyzeSettingsProps) {
    const data = this._audioBuffer.getChannelData(ch);
    const sampleRate = this._audioBuffer.sampleRate;

    const windowSize = settings.windowSize;
    const window = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / windowSize);
    }

    const startIndex = Math.floor(settings.minTime * sampleRate);
    const endIndex = Math.floor(settings.maxTime * sampleRate);

    const df = sampleRate / settings.windowSize;
    const minFreqIndex = Math.floor(
      AnalyzeService.hzToMel(settings.minFrequency) / df,
    );
    const maxFreqIndex = Math.floor(
      AnalyzeService.hzToMel(settings.maxFrequency) / df,
    );

    const ooura = new Ooura(windowSize, { type: "real", radix: 4 });

    const spectrogram: number[][] = [];
    for (let i = startIndex; i < endIndex; i += settings.hopSize) {
      // i is center of the window
      const s = i - windowSize / 2,
        t = i + windowSize / 2;
      const ss = s > 0 ? s : 0,
        tt = t < data.length ? t : data.length;

      const d = ooura.scalarArrayFactory();
      for (let j = 0; j < d.length; j++) {
        if (s + j < ss) {
          continue;
        }
        if (tt < s + j) {
          continue;
        }
        d[j] = data[s + j] * window[j];
      }

      const re = ooura.vectorArrayFactory();
      const im = ooura.vectorArrayFactory();
      ooura.fft(d.buffer, re.buffer, im.buffer);

      const spectrum: number[] = [];
      for (let j = 0; j < re.length; j++) {
        spectrum.push(re[j] * re[j] + im[j] * im[j]);
      }

      // Apply mel filter bank to the spectrum
      const melSpectrum = this.applyMelFilterBank(
        settings.melFilterNum,
        spectrum,
        sampleRate,
        minFreqIndex,
        maxFreqIndex,
      );

      spectrogram.push(melSpectrum);
    }

    let maxValue = Number.EPSILON;
    for (let i = 0; i < spectrogram.length; i++) {
      for (let j = 0; j < spectrogram[i].length; j++) {
        if (maxValue < spectrogram[i][j]) {
          maxValue = spectrogram[i][j];
        }
      }
    }

    for (let i = 0; i < spectrogram.length; i++) {
      for (let j = 0; j < spectrogram[i].length; j++) {
        spectrogram[i][j] = 10 * Math.log10(spectrogram[i][j] / maxValue);
      }
    }

    return spectrogram;
  }

  private applyMelFilterBank(
    numFilters: number,
    spectrum: number[],
    sampleRate: number,
    minFreqIndex: number,
    maxFreqIndex: number,
  ) {
    const minMel = AnalyzeService.hzToMel(
      (minFreqIndex * sampleRate) / spectrum.length,
    );
    const maxMel = AnalyzeService.hzToMel(
      (maxFreqIndex * sampleRate) / spectrum.length,
    );
    const melStep = (maxMel - minMel) / (numFilters + 1);

    const filterBank: number[][] = [];
    for (let i = 0; i < numFilters; i++) {
      const filter: number[] = [];
      const startMel = minMel + i * melStep;
      const centerMel = minMel + (i + 1) * melStep;
      const endMel = minMel + (i + 2) * melStep;
      const startIndex = Math.round(
        (AnalyzeService.melToHz(startMel) * spectrum.length) / sampleRate,
      );
      const centerIndex = Math.round(
        (AnalyzeService.melToHz(centerMel) * spectrum.length) / sampleRate,
      );
      const endIndex = Math.round(
        (AnalyzeService.melToHz(endMel) * spectrum.length) / sampleRate,
      );
      for (let j = 0; j < spectrum.length; j++) {
        if (j < startIndex || j > endIndex) {
          filter.push(0);
        } else if (j < centerIndex) {
          filter.push((j - startIndex) / (centerIndex - startIndex));
        } else {
          filter.push((endIndex - j) / (endIndex - centerIndex));
        }
      }
      filterBank.push(filter);
    }

    const melSpectrum: number[] = [];
    for (let i = 0; i < numFilters; i++) {
      let sum = 0;
      for (let j = 0; j < spectrum.length; j++) {
        sum += spectrum[j] * filterBank[i][j];
      }
      melSpectrum.push(sum);
    }

    return melSpectrum;
  }

  public static hzToMel(hz: number) {
    return 2595 * Math.log10(1 + hz / 700);
  }

  public static melToHz(mel: number) {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }
}

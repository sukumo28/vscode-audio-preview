// You should compile wasm before build extension
import Module from "./decoder/wasm/decoder.js";
import { AnalyzeSettings } from "./analyzeSettings";
import Ooura from "ooura";

interface Status {
    status: number;
    error: string;
}

interface AudioInfoResult {
    status: Status;
    encoding: string;
    sampleRate: number;
    numChannels: number;
    duration: number;
    format: string;
}

interface Vector {
    size(): number;
    get(index: number): number;
    delete(): void;
}

interface DecodeAudioResult {
    status: Status;
    samples: Vector;
}

export default class documentData {
    static audioFilePath = "audio";

    module: any;

    fileSize: number; // byte

    constructor (module: any, fileSize: number) {
        this.module = module;
        this.fileSize = fileSize;
    }

    static async create(data: Uint8Array): Promise<documentData> {
        const module = await Module();
        module.FS.writeFile(documentData.audioFilePath, data);
        return new documentData(module, data.length);
    }

    encoding: string;
    sampleRate: number;
    numChannels: number;
    duration: number;
    format: string;

    readAudioInfo() {
        const { status, ...info }: AudioInfoResult = this.module.getAudioInfo(documentData.audioFilePath);
        if (status.status < 0) {
            throw new Error(`failed to get audio info: ${status.status}: ${status.error}`);
        }
        this.encoding = info.encoding;
        this.sampleRate = info.sampleRate;
        this.numChannels = info.numChannels;
        this.duration = info.duration;
        this.format = info.format;
    }

    length: number;
    samples: Float32Array[];

    decode() {
        const { status, samples }: DecodeAudioResult = this.module.decodeAudio(documentData.audioFilePath);
        if (status.status < 0) {
            samples.delete();
            throw new Error(`failed to decode audio: ${status.status}: ${status.error}`);
        }

        this.length = samples.size() / this.numChannels;
        this.duration = this.length / this.sampleRate;

        this.samples = [];
        for (let i = 0; i < this.numChannels; i++) {
            this.samples[i] = new Float32Array(this.length);
        }

        for (let i = 0; i < this.length; i++) {
            for (let j = 0; j < this.numChannels; j++) {
                this.samples[j][i] = samples.get(i * this.numChannels + j);
            }
        }

        samples.delete();
    }

    // use number[] because this data is once stringified by postMessage() 
    // and TypedArray will be object like this: "{"0":"1.0106", "1":"0.0632", ...}"
    spectrogram: number[][][] = [];

    makeSpectrogram(ch: number, settings: AnalyzeSettings) {
        const windowSize = settings.windowSize;
        const window = new Float32Array(windowSize);
        for (let i = 0; i < windowSize; i++) {
            window[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / windowSize);
        }

        const startIndex = Math.floor(settings.minTime * this.sampleRate);
        const endIndex = Math.floor(settings.maxTime * this.sampleRate);

        const df = this.sampleRate / settings.windowSize;
        const minFreqIndex = Math.floor(settings.minFrequency / df);
        const maxFreqIndex = Math.floor(settings.maxFrequency / df);

        const ooura = new Ooura(windowSize, { type: "real", radix: 4 });

        const data = this.samples[ch];
        let maxValue = Number.EPSILON;

        this.spectrogram[ch] = [];
        for (let i = startIndex; i < endIndex; i += settings.hopSize) {
            // i is center of the window
            const s = i - windowSize / 2, t = i + windowSize / 2;
            const ss = s > 0 ? s : 0, tt = t < data.length ? t : data.length;
            const d = ooura.scalarArrayFactory();
            for (let j = 0; j < d.length; j++) {
                if (s + j < ss) continue;
                if (tt < s + j) continue;
                d[j] = data[s + j] * window[j];
            }

            const re = ooura.vectorArrayFactory();
            const im = ooura.vectorArrayFactory();
            ooura.fft(d.buffer, re.buffer, im.buffer);

            const ps = [];
            for (let j = minFreqIndex; j < maxFreqIndex; j++) {
                const v = re[j] * re[j] + im[j] * im[j];
                ps.push(v);
                if (maxValue < v) maxValue = v;
            }

            this.spectrogram[ch].push(ps);
        }

        for (let i = 0; i < this.spectrogram[ch].length; i++) {
            for (let j = minFreqIndex; j < maxFreqIndex; j++) {
                this.spectrogram[ch][i][j] = 10 * Math.log10(this.spectrogram[ch][i][j] / maxValue);
            }
        }
    }

    dispose() {
        this.module.FS.unlink(documentData.audioFilePath);
    }
}
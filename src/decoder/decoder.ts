// You should compile wasm before build extension
import Module from "./wasm/decoder.js";

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

export default class AudioDecoder {
    static audioFilePath = "audio";

    module: any;

    fileSize: number; // byte
    encoding: string;
    sampleRate: number;
    numChannels: number;
    duration: number;
    format: string; // https://ffmpeg.org/doxygen/3.1/group__lavu__sampfmts.html

    length: number;
    samples: Float32Array[];

    constructor (module: any, fileSize: number) {
        this.module = module;
        this.fileSize = fileSize;
    }

    static async instanciate(data: Uint8Array): Promise<AudioDecoder> {
        const module = await Module();
        module.FS.writeFile(AudioDecoder.audioFilePath, data);
        return new AudioDecoder(module, data.length);
    }

    readAudioInfo() {
        const { status, ...info }: AudioInfoResult = this.module.getAudioInfo(AudioDecoder.audioFilePath);
        if (status.status < 0) {
            throw new Error(`failed to get audio info: ${status.status}: ${status.error}`);
        }
        this.encoding = info.encoding;
        this.sampleRate = info.sampleRate;
        this.numChannels = info.numChannels;
        this.duration = info.duration;
        this.format = info.format;
    }

    decode() {
        const { status, samples }: DecodeAudioResult = this.module.decodeAudio(AudioDecoder.audioFilePath);
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
                this.samples[j][i] = samples.get(i*this.numChannels + j);
            }
        }

        samples.delete();
    }

    dispose() {
        this.module.FS.unlink(AudioDecoder.audioFilePath);
    }
}
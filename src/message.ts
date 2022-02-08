export interface AnalyzeDefault {
    windowSizeIndex: number,
    minAmplitude: number,
    maxAmplitude: number,
    minFrequency: number,
    maxFrequency: number,
}

export interface AnalyzeSettings {
    windowSize: number,
    minFrequency: number,
    maxFrequency: number,
    minTime: number,
    maxTime: number,
    minAmplitude: number,
    maxAmplitude: number,
    analyzeID: number
}

export const ExtMessageType = {
    Info: "info",
    Prepare: "prepare",
    Data: "data",
    Spectrogram: "spectrogram",
    Reload: "reload",
} as const;
export type ExtMessageType = typeof ExtMessageType[keyof typeof ExtMessageType];

export class ExtMessage {
    type: ExtMessageType;
    data?: ExtInfoData | ExtPrepareData | ExtDataData | ExtSpectrogramData;
}

export interface ExtInfoData {
    audioFormat: string;
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
    chunkSize: number;
    isTrusted?: boolean;
}

export interface ExtPrepareData {
    duration: number;
    sampleRate: number;
    numberOfChannels: number;
    length: number;
    analyzeDefault: AnalyzeDefault;
}

export interface ExtDataData {
    autoPlay?: boolean;
    autoAnalyze?: boolean;
    numberOfChannels: number;
    length: number;
    samples: number[][];
    start: number;
    end: number;
    wholeLength: number;
}

export interface ExtSpectrogramData {
    channel: number;
    start: number;
    end: number;
    settings: AnalyzeSettings,
    spectrogram: number[][],
}

export const WebviewMessageType = {
    Ready: "ready",
    Prepare: "prepare",
    Data: "data",
    Spectrogram: "spectrogram",
    Error: "error",
} as const;
export type WebviewMessageType = typeof WebviewMessageType[keyof typeof WebviewMessageType];

export interface WebviewMessage {
    type: WebviewMessageType;
    data?: WebviewDataData | WebviewSpectrogramData | WebviewErrorData;
}

export interface WebviewDataData {
    start: number;
    end: number;
}

export interface WebviewSpectrogramData {
    channel: number;
    start: number;
    end: number;
    settings: AnalyzeSettings,
}

export interface WebviewErrorData {
    message: string
}

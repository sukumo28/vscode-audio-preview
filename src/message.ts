import { AnalyzeDefault, AnalyzeSettings } from "./analyzeSettings";

export const ExtMessageType = {
    Info: "info",
    Prepare: "prepare",
    Data: "data",
    MakeSpectrogram: "makeSpectrogram",
    Spectrogram: "spectrogram",
    Reload: "reload",
} as const;
export type ExtMessageType = typeof ExtMessageType[keyof typeof ExtMessageType];

export class ExtMessage {
    type: ExtMessageType;
    data?: ExtInfoData | ExtPrepareData | ExtDataData | ExtMakeSpectrogramData | ExtSpectrogramData;
}

export interface ExtInfoData {
    encoding: string;
    format: string;
    numChannels: number;
    sampleRate: number;
    fileSize: number;
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

export interface ExtMakeSpectrogramData {
    channel: number;
    settings: AnalyzeSettings;
}

export interface ExtSpectrogramData {
    channel: number;
    startBlockIndex: number;
    isEnd: boolean;
    endBlockIndex: number;
    spectrogram: number[][];
    settings: AnalyzeSettings;
}

export const WebviewMessageType = {
    Ready: "ready",
    Prepare: "prepare",
    Data: "data",
    MakeSpectrogram: "makeSpectrogram",
    Spectrogram: "spectrogram",
    Error: "error",
} as const;
export type WebviewMessageType = typeof WebviewMessageType[keyof typeof WebviewMessageType];

export interface WebviewMessage {
    type: WebviewMessageType;
    data?: WebviewDataData | WebviewMakeSpectrogramData | WebviewSpectrogramData | WebviewErrorData;
}

export interface WebviewDataData {
    start: number;
    end: number;
}

export interface WebviewMakeSpectrogramData {
    channel: number;
    settings: AnalyzeSettings;
}

export interface WebviewSpectrogramData {
    channel: number;
    startBlockIndex: number;
    blockSize: number;
    settings: AnalyzeSettings;
}

export interface WebviewErrorData {
    message: string;
}

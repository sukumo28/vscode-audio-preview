import { AnalyzeDefault, AnalyzeSettings } from "./analyzeSettings";

// Type of messages from Extension to Webview
export const ExtMessageType = {
    Info: "info",
    Prepare: "prepare",
    Data: "data",
    Reload: "reload",
} as const;
export type ExtMessageType = typeof ExtMessageType[keyof typeof ExtMessageType];

export type ExtMessage = ExtInfoMessage | ExtPrepareMessage | ExtDataMessage | ExtReloadMessage;

export class ExtInfoMessage {
    type = ExtMessageType.Info;
    data: ExtInfoData;
}

export interface ExtInfoData {
    encoding: string;
    format: string;
    numChannels: number;
    sampleRate: number;
    fileSize: number;
    isTrusted?: boolean;
}

export class ExtPrepareMessage {
    type = ExtMessageType.Prepare;
    data: ExtPrepareData;
}

export interface ExtPrepareData {
    duration: number;
    sampleRate: number;
    numberOfChannels: number;
    length: number;
    analyzeDefault: AnalyzeDefault;
}

export class ExtDataMessage {
    type = ExtMessageType.Data;
    data: ExtDataData;
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

export class ExtReloadMessage {
    type = ExtMessageType.Reload;
}

// Type of messages from Webview to Extension
export const WebviewMessageType = {
    Ready: "ready",
    Prepare: "prepare",
    Data: "data",
    Error: "error",
} as const;
export type WebviewMessageType = typeof WebviewMessageType[keyof typeof WebviewMessageType];

export type WebviewMessage = WebviewReadyMessage | WebviewPrepareMessage | WebviewDataMessage | WebviewErrorMessage;

export class WebviewReadyMessage {
    type = WebviewMessageType.Ready;
}

export class WebviewPrepareMessage {
    type = WebviewMessageType.Prepare;
}

export class WebviewDataMessage {
    type = WebviewMessageType.Data;
    data: WebviewDataData;
}

export interface WebviewDataData { 
    start: number;
    end: number;
}

export class WebviewErrorMessage {
    type = WebviewMessageType.Error;
    data: WebviewErrorData;
}

export interface WebviewErrorData {
    message: string;
}

// Type of post message funtion
export type postMessage = (message: WebviewMessage) => void;
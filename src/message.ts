import { Config } from "./config";

// Type of messages from Extension to Webview
export const ExtMessageType = {
    Config: "config",
    Data: "data",
    Reload: "reload",
} as const;
export type ExtMessageType = typeof ExtMessageType[keyof typeof ExtMessageType];

export type ExtMessage = ExtConfigMessage | ExtDataMessage | ExtReloadMessage;

export class ExtConfigMessage {
    type = ExtMessageType.Config;
    data: Config;
}

export class ExtDataMessage {
    type = ExtMessageType.Data;
    data: ExtData;
}

export interface ExtData {
    samples: string;
    start: number;
    end: number;
    wholeLength: number;
}

export class ExtReloadMessage {
    type = ExtMessageType.Reload;
}

// Type of messages from Webview to Extension
export const WebviewMessageType = {
    Config: "config",
    Data: "data",
    Error: "error",
} as const;
export type WebviewMessageType = typeof WebviewMessageType[keyof typeof WebviewMessageType];

export type WebviewMessage = WebviewConfigMessage | WebviewDataMessage | WebviewErrorMessage;

export class WebviewConfigMessage {
    type = WebviewMessageType.Config;
}

export class WebviewDataMessage {
    type = WebviewMessageType.Data;
    data: WebviewData;
}

export interface WebviewData { 
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
import { WebviewMessage } from "../message";
import WebView from "./ui/webview";
import Decoder from "./decoder";

export interface vscode {
    postMessage(message: any): void;
}

// vscode must be passed by this special function
declare function acquireVsCodeApi(): vscode;
const vscode = acquireVsCodeApi();

function postMessage (message: WebviewMessage) {
    vscode.postMessage(message);
}

function createAudioContext (sampleRate: number) {
    return new AudioContext({ sampleRate });
}

function createDecoder (fileData: Uint8Array) {
    return Decoder.create(fileData);
}

// entry point
new WebView(postMessage, createAudioContext, createDecoder);

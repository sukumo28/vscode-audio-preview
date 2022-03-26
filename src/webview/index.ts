import { WebviewMessage } from "../message";
import WebView from "./ui/webview";

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

// entry point
new WebView(postMessage, createAudioContext);
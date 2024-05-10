import "./styles/vscode.css";
import { WebviewMessage } from "../message";
import Decoder from "./decoder";
import WebView from "./components/webview/webview";

export interface vscode {
  postMessage(message): void;
}

// vscode must be passed by this special function
declare function acquireVsCodeApi(): vscode;
const vscode = acquireVsCodeApi();

function postMessage(message: WebviewMessage) {
  vscode.postMessage(message);
}

function createAudioContext(sampleRate: number) {
  return new AudioContext({ sampleRate });
}

function createDecoder(fileData: Uint8Array) {
  return Decoder.create(fileData);
}

// entry point
new WebView(postMessage, createAudioContext, createDecoder);

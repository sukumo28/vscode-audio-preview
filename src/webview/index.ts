import { WebviewMessage } from "../message";
import WebView from "./webview";

export interface vscode {
    postMessage(message: any): void;
}

// vscode must be passed by this special function
declare function acquireVsCodeApi(): vscode;
const vscode = acquireVsCodeApi();

function postMessage (message: WebviewMessage) {
    vscode.postMessage(message);
}

// entry point
new WebView(postMessage);
import { WebviewMessage } from "../message";

interface vscode {
    postMessage(message: any): void;
}
declare function acquireVsCodeApi(): vscode;
const vscode = acquireVsCodeApi();

export function postMessage(message: WebviewMessage) {
    vscode.postMessage(message);
}
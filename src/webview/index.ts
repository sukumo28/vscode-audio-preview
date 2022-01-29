import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";
import { EventType } from "./events";
import { Disposable, disposeAll } from "../dispose";

interface vscode {
    postMessage(message: any): void;
}
declare function acquireVsCodeApi(): vscode;
const vscode = acquireVsCodeApi();

const disposable: Disposable[] = [];

// init webview layout
function initWebviewLayout() {
    const root = document.getElementById("root");
    root.innerHTML = `
    <div id="info-and-control">
        <div id="info-table"></div>
    
        <div id="player"></div>
    </div>
    
    <div id="analyzer"></div>
    
    <div id="analyze-result-box"></div>
    `;
}

// Handle messages from the extension
window.addEventListener('message', e => {
    const { type, data, isTrusted } = e.data;

    switch (type) {
        case "info":
            const infoTable = new InfoTable("info-table");
            disposable.push(infoTable);

            infoTable.showInfo(data);
            
            // do not play audio in untrusted workspace 
            if (isTrusted === false) {
                vscode.postMessage({ type: 'error', message: "Cannot play audio in untrusted workspaces" });
                break;
            }

            vscode.postMessage({ type: 'prepare' });
            break;

        case "prepare":
            try {
                // create AudioContext and AudioBuffer
                const ac = new AudioContext({ sampleRate: data.sampleRate });
                const audioBuffer = ac.createBuffer(data.numberOfChannels, data.length, data.sampleRate);
                for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                    const f32a = new Float32Array(audioBuffer.length);
                    audioBuffer.copyToChannel(f32a, ch);
                }

                // set player ui
                const player = new Player("player", ac, audioBuffer);
                disposable.push(player);

                // init analyzer
                const analyzer = new Analyzer("analyzer", audioBuffer);
                disposable.push(analyzer);
            } catch (err) {
                vscode.postMessage({ type: 'error', message: "failed to prepare:" + err });
                break;
            }

            vscode.postMessage({ type: 'data', start: 0, end: 10000 });
            break;

        case "reload":
            disposeAll(disposable);
            initWebviewLayout();
            vscode.postMessage({ type: 'ready' });
            break;
    }
});

window.addEventListener(EventType.PostMessage, (e: CustomEventInit) => {
    vscode.postMessage(e.detail.message);
});

// Signal to VS Code that the webview is initialized.
initWebviewLayout();
vscode.postMessage({ type: 'ready' });
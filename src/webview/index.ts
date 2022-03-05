import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";
import { EventType } from "./events";
import { ExtMessage, ExtMessageType, WebviewMessageType } from "../message";
import { Disposable, disposeAll } from "../dispose";
import { postMessage } from "./vscode";

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

// handle messages from the extension
function onReceiveMessage(msg: ExtMessage) {
    switch (msg.type) {
        case ExtMessageType.Info: {
            const infoTable = new InfoTable("info-table");
            disposable.push(infoTable);

            infoTable.showInfo(msg.data);

            // do not play audio in untrusted workspace 
            if (msg.data.isTrusted === false) {
                postMessage({ type: WebviewMessageType.Error, data: { message: "Cannot play audio in untrusted workspaces" } });
                break;
            }

            postMessage({ type: WebviewMessageType.Prepare });
            break;
        }

        case ExtMessageType.Prepare: {
            try {
                // create AudioContext and AudioBuffer
                const ac = new AudioContext({ sampleRate: msg.data.sampleRate });
                const audioBuffer = ac.createBuffer(msg.data.numberOfChannels, msg.data.length, msg.data.sampleRate);
                for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                    const f32a = new Float32Array(audioBuffer.length);
                    audioBuffer.copyToChannel(f32a, ch);
                }

                // set player ui
                const player = new Player("player", ac, audioBuffer);
                disposable.push(player);

                // init analyzer
                const analyzer = new Analyzer("analyzer", audioBuffer, msg.data.analyzeDefault);
                disposable.push(analyzer);
            } catch (err) {
                postMessage({ type: WebviewMessageType.Error, data: { message: "failed to prepare:" + err } });
                break;
            }

            postMessage({ type: WebviewMessageType.Data, data: { start: 0, end: 100000 } });
            break;
        }

        case ExtMessageType.Reload: {
            disposeAll(disposable);
            initWebviewLayout();
            postMessage({ type: WebviewMessageType.Ready });
            break;
        }
    }
}

// init webview
initWebviewLayout();
window.addEventListener(EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => onReceiveMessage(e.data));
// Signal to VS Code that the webview is initialized.
postMessage({ type: WebviewMessageType.Ready });
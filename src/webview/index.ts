import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";
import { EventType } from "./events";
import { ExtInfoData, ExtMessage, ExtMessageType, ExtPrepareData, WebviewMessage, WebviewMessageType } from "../message";
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
window.addEventListener(EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => {
    const { type, data } = e.data;

    switch (type) {
        case ExtMessageType.Info: {
            const extData = data as ExtInfoData;
            const infoTable = new InfoTable("info-table");
            disposable.push(infoTable);

            infoTable.showInfo(extData);

            // do not play audio in untrusted workspace 
            if (extData.isTrusted === false) {
                postMessage({ type: WebviewMessageType.Error, data: { message: "Cannot play audio in untrusted workspaces" }});
                break;
            }

            postMessage({ type: WebviewMessageType.Prepare });
            break;
        }

        case ExtMessageType.Prepare: {
            const extData = data as ExtPrepareData;
            try {
                // create AudioContext and AudioBuffer
                const ac = new AudioContext({ sampleRate: extData.sampleRate });
                const audioBuffer = ac.createBuffer(extData.numberOfChannels, extData.length, extData.sampleRate);
                for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                    const f32a = new Float32Array(audioBuffer.length);
                    audioBuffer.copyToChannel(f32a, ch);
                }

                // set player ui
                const player = new Player("player", ac, audioBuffer);
                disposable.push(player);

                // init analyzer
                const analyzer = new Analyzer("analyzer", audioBuffer, extData.analyzeDefault);
                disposable.push(analyzer);
            } catch (err) {
                postMessage({ type: WebviewMessageType.Error, data: { message: "failed to prepare:" + err } });
                break;
            }

            postMessage({ type: WebviewMessageType.Data, data: { start: 0, end: 100000 } });
            break;
        }

        case ExtMessageType.Reload:
            disposeAll(disposable);
            initWebviewLayout();
            postMessage({ type: WebviewMessageType.Ready });
            break;
    }
});

// Signal to VS Code that the webview is initialized.
initWebviewLayout();
postMessage({ type: WebviewMessageType.Ready });
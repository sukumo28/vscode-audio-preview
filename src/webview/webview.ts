import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";
import { EventType } from "./events";
import { ExtMessage, ExtMessageType, postMessage, WebviewMessageType } from "../message";
import { Disposable, disposeAll } from "../dispose";

type createAudioContext = (sampleRate: number) => AudioContext;

export default class WebView {
    disposables: Disposable[] = [];
    postMessage: postMessage;
    createAudioContext: createAudioContext;

    constructor (postMessage: postMessage, createAudioContext: createAudioContext) {
        this.postMessage = postMessage;
        this.createAudioContext = createAudioContext;
        window.addEventListener(EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveMessage(e.data));
        this.initWebviewLayout();
        this.postMessage({ type: WebviewMessageType.Ready });
    }

    initWebviewLayout() {
        const root = document.getElementById("root");
        root.innerHTML = `
        <div id="info-and-control">
            <div id="info-table"></div>
        
            <div id="player"></div>
        </div>
        
        <div id="analyzer"></div>
        
        <div id="analyze-result-box"></div>
        `;
    };

    onReceiveMessage(msg: ExtMessage) {
        switch (msg.type) {
            case ExtMessageType.Info: {
                const infoTable = new InfoTable("info-table");
                this.disposables.push(infoTable);
    
                infoTable.showInfo(msg.data);
    
                // do not play audio in untrusted workspace 
                if (msg.data.isTrusted === false) {
                    this.postMessage({ type: WebviewMessageType.Error, data: { message: "Cannot play audio in untrusted workspaces" } });
                    break;
                }
    
                this.postMessage({ type: WebviewMessageType.Prepare });
                break;
            }
    
            case ExtMessageType.Prepare: {
                try {
                    // create AudioContext and AudioBuffer
                    const ac = this.createAudioContext(msg.data.sampleRate);
                    const audioBuffer = ac.createBuffer(msg.data.numberOfChannels, msg.data.length, msg.data.sampleRate);
                    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                        const f32a = new Float32Array(audioBuffer.length);
                        audioBuffer.copyToChannel(f32a, ch);
                    }
    
                    // set player ui
                    const player = new Player("player", ac, audioBuffer, this.postMessage);
                    this.disposables.push(player);
    
                    // init analyzer
                    const analyzer = new Analyzer("analyzer", audioBuffer, msg.data.analyzeDefault, this.postMessage);
                    this.disposables.push(analyzer);
                } catch (err) {
                    this.postMessage({ type: WebviewMessageType.Error, data: { message: "failed to prepare:" + err } });
                    break;
                }
    
                this.postMessage({ type: WebviewMessageType.Data, data: { start: 0, end: 100000 } });
                break;
            }
    
            case ExtMessageType.Reload: {
                disposeAll(this.disposables);
                this.initWebviewLayout();
                this.postMessage({ type: WebviewMessageType.Ready });
                break;
            }
        }
    }
}
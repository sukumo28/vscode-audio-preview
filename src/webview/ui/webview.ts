import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";
import { Event, EventType } from "../events";
import { ExtMessage, ExtMessageType, postMessage, WebviewMessageType } from "../../message";
import { Disposable, disposeAll } from "../../dispose";

type createAudioContext = (sampleRate: number) => AudioContext;

export default class WebView {
    private _postMessage: postMessage;
    private _createAudioContext: createAudioContext;
    private _disposables: Disposable[] = [];

    constructor (postMessage: postMessage, createAudioContext: createAudioContext) {
        this._postMessage = postMessage;
        this._createAudioContext = createAudioContext;
        this.initWebview();
    }

    private initWebview() {
        this._disposables.push(
            new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveMessage(e.data))
        );
        const root = document.getElementById("root");
        root.innerHTML = `
        <div id="info-table"></div>
        
        <div id="player"></div>
        
        <div id="analyzer"></div>
        `;
        this._postMessage({ type: WebviewMessageType.Ready });
    };

    private onReceiveMessage(msg: ExtMessage) {
        switch (msg.type) {
            case ExtMessageType.Info: {
                const infoTable = new InfoTable("info-table");
                this._disposables.push(infoTable);
    
                infoTable.showInfo(msg.data);
    
                // do not play audio in untrusted workspace 
                if (msg.data.isTrusted === false) {
                    this._postMessage({ type: WebviewMessageType.Error, data: { message: "Cannot play audio in untrusted workspaces" } });
                    break;
                }
    
                this._postMessage({ type: WebviewMessageType.Prepare });
                break;
            }
    
            case ExtMessageType.Prepare: {
                try {
                    // create AudioContext and AudioBuffer
                    const ac = this._createAudioContext(msg.data.sampleRate);
                    const audioBuffer = ac.createBuffer(msg.data.numberOfChannels, msg.data.length, msg.data.sampleRate);
                    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                        const f32a = new Float32Array(audioBuffer.length);
                        audioBuffer.copyToChannel(f32a, ch);
                    }
    
                    // set player ui
                    const player = new Player("player", ac, audioBuffer, this._postMessage);
                    this._disposables.push(player);
    
                    // init analyzer
                    const analyzer = new Analyzer("analyzer", audioBuffer, msg.data.analyzeDefault);
                    this._disposables.push(analyzer);
                } catch (err) {
                    this._postMessage({ type: WebviewMessageType.Error, data: { message: "failed to prepare:" + err } });
                    break;
                }
    
                this._postMessage({ type: WebviewMessageType.Data, data: { start: 0, end: 100000 } });
                break;
            }
    
            case ExtMessageType.Reload: {
                this.dispose();
                this.initWebview();
                break;
            }
        }
    }

    public dispose() {
        disposeAll(this._disposables);
    }
}
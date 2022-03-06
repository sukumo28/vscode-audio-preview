import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";
import { Event, EventType } from "./events";
import { ExtMessage, ExtMessageType, postMessage, WebviewMessageType } from "../message";
import { Disposable } from "../dispose";

type createAudioContext = (sampleRate: number) => AudioContext;

export default class WebView extends Disposable{
    postMessage: postMessage;
    createAudioContext: createAudioContext;

    constructor (postMessage: postMessage, createAudioContext: createAudioContext) {
        super();
        this.postMessage = postMessage;
        this.createAudioContext = createAudioContext;
        this.initWebview();
    }

    initWebview() {
        this._register(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveMessage(e.data)));
        const root = document.getElementById("root");
        root.innerHTML = `
        <div id="info-and-control">
            <div id="info-table"></div>
        
            <div id="player"></div>
        </div>
        
        <div id="analyzer"></div>
        
        <div id="analyze-result-box"></div>
        `;
        this.postMessage({ type: WebviewMessageType.Ready });
    };

    onReceiveMessage(msg: ExtMessage) {
        switch (msg.type) {
            case ExtMessageType.Info: {
                const infoTable = new InfoTable("info-table");
                this._register(infoTable);
    
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
                    console.log(msg);
                    const ac = this.createAudioContext(msg.data.sampleRate);
                    const audioBuffer = ac.createBuffer(msg.data.numberOfChannels, msg.data.length, msg.data.sampleRate);
                    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                        const f32a = new Float32Array(audioBuffer.length);
                        audioBuffer.copyToChannel(f32a, ch);
                    }
    
                    // set player ui
                    const player = new Player("player", ac, audioBuffer, this.postMessage);
                    this._register(player);
    
                    // init analyzer
                    const analyzer = new Analyzer("analyzer", audioBuffer, msg.data.analyzeDefault, this.postMessage);
                    this._register(analyzer);
                } catch (err) {
                    this.postMessage({ type: WebviewMessageType.Error, data: { message: "failed to prepare:" + err } });
                    break;
                }
    
                this.postMessage({ type: WebviewMessageType.Data, data: { start: 0, end: 100000 } });
                break;
            }
    
            case ExtMessageType.Reload: {
                this.dispose();
                this.initWebview();
                break;
            }
        }
    }
}
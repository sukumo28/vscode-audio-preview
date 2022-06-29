import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";
import { Event, EventType } from "../events";
import { ExtMessage, ExtMessageType, postMessage, WebviewMessageType } from "../../message";
import { Disposable, disposeAll } from "../../dispose";
import { Config } from "../../config";
import documentData from "../../documentData";

type createAudioContext = (sampleRate: number) => AudioContext;

export default class WebView {
    private _postMessage: postMessage;
    private _createAudioContext: createAudioContext;
    
    private _disposables: Disposable[] = [];

    private _config: Config;
    private _fileData: Uint8Array;

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
        this._postMessage({ type: WebviewMessageType.Config });
    };

    private onReceiveMessage(msg: ExtMessage) {
        switch (msg.type) {
            case ExtMessageType.Config: {
                this._config = msg.data

                this._postMessage({ type: WebviewMessageType.Data, data: { start: 0, end: 3000000 } });
                break;
            }
    
            case ExtMessageType.Data: {
                // init fileData
                console.log(msg);
                if (!this._fileData) {
                    this._fileData = new Uint8Array(msg.data.wholeLength);
                }

                // set fileData
                console.log("start copy");
                for (let i = 0; i < msg.data.samples.length; i++) {
                    this._fileData[i + msg.data.start] = msg.data.samples[i];
                }
                console.log("copy done");
    
                // request next data
                if (msg.data.end < msg.data.wholeLength) {
                    this._postMessage({ type: WebviewMessageType.Data, data: { start: msg.data.end, end: msg.data.end+3000000 } });
                    break;
                }

                this.activateUI();
                break;
            }
    
            case ExtMessageType.Reload: {
                this.dispose();
                this.initWebview();
                break;
            }
        }
    }

    private async activateUI() {
        console.log("init decoder");
        const decoder = await documentData.create(this._fileData);

        console.log("read header info");
        decoder.readAudioInfo();

        new InfoTable(
            "info-table",
            decoder.numChannels,
            decoder.encoding,
            decoder.format,
            decoder.sampleRate,
            decoder.fileSize
        );

        console.log("decode");
        decoder.decode();

        console.log("show ui");
        const audioContext = this._createAudioContext(decoder.sampleRate);
        const audioBuffer = audioContext.createBuffer(decoder.numChannels, decoder.length, decoder.sampleRate);
        for (let ch = 0; ch < decoder.numChannels; ch++) {
            const d = Float32Array.from(decoder.samples[ch]);
            audioBuffer.copyToChannel(d, ch);
        }
        const player = new Player("player", audioContext, audioBuffer, this._config.autoPlay);
        this._disposables.push(player);
        const analyzer = new Analyzer("analyzer", audioBuffer, this._config.analyzeConfigDefault, this._config.autoAnalyze);
        this._disposables.push(analyzer);

        decoder.dispose();
    }

    public dispose() {
        disposeAll(this._disposables);
    }
}
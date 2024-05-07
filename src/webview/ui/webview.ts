import InfoTableComponent from "./infoTableComponent";
import PlayerComponent  from "./playerComponent";
import PlayerService from "../service/playerService";
import AnalyzerComponent from "./analyzerComponent";
import { Event, EventType } from "../events";
import { ExtMessage, ExtMessageType, postMessage, WebviewMessageType } from "../../message";
import { Disposable, disposeAll } from "../../dispose";
import { Config } from "../../config";
import Decoder from "../decoder";
import AnalyzeSettingsService from "../service/analyzeSettingsService";
import AnalyzeService from "../service/analyzeService";
import PlayerSettingsService from "../service/playerSettingsService";

type CreateAudioContext = (sampleRate: number) => AudioContext;
type CreateDecoder = (fileData: Uint8Array) => Promise<Decoder>;

export default class WebView {
    private _fileData: Uint8Array;

    private _postMessage: postMessage;
    private _createAudioContext: CreateAudioContext;
    private _createDecoder: CreateDecoder;

    private _config: Config;

    private _disposables: Disposable[] = [];

    constructor (postMessage: postMessage, createAudioContext: CreateAudioContext, createDecoder: CreateDecoder) {
        this._postMessage = postMessage;
        this._createAudioContext = createAudioContext;
        this._createDecoder = createDecoder;
        this.initWebview();
    }

    private initWebview() {
        this._fileData = undefined;

        this._disposables.push(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveMessage(e.data)));
        
        const root = document.getElementById("root");
        root.innerHTML = `
        <div id="info-table"></div>
        
        <div id="player"></div>
        
        <div id="analyzer"></div>
        `;
        
        this._postMessage({ type: WebviewMessageType.Config });
    };

    private async onReceiveMessage(msg: ExtMessage) {
        switch (msg.type) {
            case ExtMessageType.Config: {
                this._config = msg.data;
                console.log(msg.data);
                this._postMessage({ type: WebviewMessageType.Data, data: { start: 0, end: 500000 } });
                break;
            }

            case ExtMessageType.Data: {      
                // init fileData after receiving first data
                if (!this._fileData) {
                    console.log('start receiving data');
                    this._fileData = new Uint8Array(msg.data.wholeLength);
                }
                
                // set fileData
                console.log(`received data: ${msg.data.start} ~ ${msg.data.end} / ${msg.data.wholeLength}`);
                const samples = new Uint8Array(msg.data.samples);
                this._fileData.set(samples, msg.data.start);

                // request next data
                if (msg.data.end < msg.data.wholeLength) {
                    this._postMessage({ type: WebviewMessageType.Data, data: { start: msg.data.end, end: msg.data.end + 3000000 } });
                    break;
                }

                console.log('finish receiving data');
                try {
                    await this.activateUI();
                } catch (err) {
                    this._postMessage({ type: WebviewMessageType.Error, data: { message: err.message } });
                }
                
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
        const decoder = await this._createDecoder(this._fileData);

        // show header info
        console.log("read header info");
        decoder.readAudioInfo();
        const infoTableComponent = new InfoTableComponent("info-table");
        infoTableComponent.showInfo(
            decoder.numChannels,
            decoder.sampleRate,
            decoder.fileSize,
            decoder.format,
            decoder.encoding
        );

        // decode
        console.log("decode");
        decoder.decode();

        console.log("show other ui");
        // show additional info
        infoTableComponent.showAdditionalInfo(decoder.duration);
        // init audio context and buffer
        const audioContext = this._createAudioContext(decoder.sampleRate);
        const audioBuffer = audioContext.createBuffer(decoder.numChannels, decoder.length, decoder.sampleRate);
        for (let ch = 0; ch < decoder.numChannels; ch++) {
            const d = Float32Array.from(decoder.samples[ch]);
            audioBuffer.copyToChannel(d, ch);
        }
        // init player
        const playerService = new PlayerService(audioContext, audioBuffer);
        const playerSettingsService = PlayerSettingsService.fromDefaultSetting(this._config.playerDefault);
        const playerComponent = new PlayerComponent("player", playerService, playerSettingsService);
        this._disposables.push(playerService, playerComponent);
        // init analyzer
        const analyzeService = new AnalyzeService(audioBuffer);
        const analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(this._config.analyzeDefault, audioBuffer);
        const analyzerComponent = new AnalyzerComponent("analyzer", audioBuffer, analyzeService, analyzeSettingsService, this._config.autoAnalyze);
        this._disposables.push(analyzerComponent);
        // dispose decoder
        decoder.dispose();
    }

    public dispose() {
        disposeAll(this._disposables);
    }
}
import "./webview.css";
import { EventType } from "../../events";
import {
  ExtMessage,
  ExtMessageType,
  PostMessage,
  WebviewMessageType,
} from "../../../message";
import Component from "../../component";
import { Config } from "../../../config";
import Decoder from "../../decoder";
import PlayerService from "../../services/playerService";
import PlayerSettingsService from "../../services/playerSettingsService";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";
import InfoTableComponent from "../infoTable/infoTableComponent";
import PlayerComponent from "../player/playerComponent";
import SettingTab from "../settingTab/settingTabComponent";
import AnalyzerComponent from "../analyzer/analyzerComponent";

type CreateAudioContext = (sampleRate: number) => AudioContext;
type CreateDecoder = (fileData: Uint8Array) => Promise<Decoder>;

export default class WebView extends Component {
  private _fileData: Uint8Array;

  private _postMessage: PostMessage;
  private _createAudioContext: CreateAudioContext;
  private _createDecoder: CreateDecoder;

  private _config: Config;

  constructor(
    postMessage: PostMessage,
    createAudioContext: CreateAudioContext,
    createDecoder: CreateDecoder,
  ) {
    super();
    this._postMessage = postMessage;
    this._createAudioContext = createAudioContext;
    this._createDecoder = createDecoder;
    this.initWebview();
  }

  private initWebview() {
    this._isDisposed = false;
    this._fileData = undefined;

    this._addEventlistener(
      window,
      EventType.VSCODE_MESSAGE,
      (e: MessageEvent<ExtMessage>) => this.onReceiveMessage(e.data),
    );

    const root = document.getElementById("root");
    root.innerHTML = `
      <div id="infoTable"></div>
      <div id="player"></div>
      <div id="settingTab"></div>
      <div id="analyzer"></div>
    `;

    this._postMessage({ type: WebviewMessageType.CONFIG });
  }

  private async onReceiveMessage(msg: ExtMessage) {
    switch (msg.type) {
      case ExtMessageType.CONFIG:
        if (ExtMessageType.isCONFIG(msg)) {
          this._config = msg.data;
          console.log(msg.data);
          this._postMessage({
            type: WebviewMessageType.DATA,
            data: { start: 0, end: 500000 },
          });
        }
        break;

      case ExtMessageType.DATA:
        if (ExtMessageType.isDATA(msg)) {
          // init fileData after receiving first data
          if (!this._fileData) {
            console.log("start receiving data");
            this._fileData = new Uint8Array(msg.data.wholeLength);
          }

          // set fileData
          console.log(
            `received data: ${msg.data.start} ~ ${msg.data.end} / ${msg.data.wholeLength}`,
          );
          const samples = new Uint8Array(msg.data.samples);
          this._fileData.set(samples, msg.data.start);

          // request next data
          if (msg.data.end < msg.data.wholeLength) {
            this._postMessage({
              type: WebviewMessageType.DATA,
              data: { start: msg.data.end, end: msg.data.end + 3000000 },
            });
            break;
          }

          console.log("finish receiving data");
          try {
            await this.activateUI();
          } catch (err) {
            this._postMessage({
              type: WebviewMessageType.ERROR,
              data: { message: err.message },
            });
          }
        }
        break;

      case ExtMessageType.RELOAD: {
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
    const infoTableComponent = new InfoTableComponent("#infoTable");
    infoTableComponent.showInfo(
      decoder.numChannels,
      decoder.sampleRate,
      decoder.fileSize,
      decoder.format,
      decoder.encoding,
    );

    // decode
    console.log("decode");
    decoder.decode();

    console.log("show other ui");
    // show additional info
    infoTableComponent.showAdditionalInfo(decoder.duration);
    // init audio context and buffer
    const audioContext = this._createAudioContext(decoder.sampleRate);
    const audioBuffer = audioContext.createBuffer(
      decoder.numChannels,
      decoder.length,
      decoder.sampleRate,
    );
    for (let ch = 0; ch < decoder.numChannels; ch++) {
      const d = Float32Array.from(decoder.samples[ch]);
      audioBuffer.copyToChannel(d, ch);
    }
    // init player
    const playerService = new PlayerService(audioContext, audioBuffer);
    const playerSettingsService = PlayerSettingsService.fromDefaultSetting(
      this._config.playerDefault,
    );
    const playerComponent = new PlayerComponent(
      "#player",
      playerService,
      playerSettingsService,
    );
    this._disposables.push(playerService, playerComponent);

    // init setting tab
    const analyzeService = new AnalyzeService(audioBuffer);
    const analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(
      this._config.analyzeDefault,
      audioBuffer,
    );
    const settingTabComponent = new SettingTab(
      "#settingTab",
      analyzeService,
      analyzeSettingsService,
      audioBuffer,
      this._postMessage,
    );
    this._disposables.push(
      analyzeService,
      analyzeSettingsService,
      settingTabComponent,
    );

    // init analyzer
    const analyzerComponent = new AnalyzerComponent(
      "#analyzer",
      audioBuffer,
      analyzeService,
      analyzeSettingsService,
      playerService,
      this._config.autoAnalyze,
    );
    this._disposables.push(analyzerComponent);

    // dispose decoder
    decoder.dispose();
  }
}

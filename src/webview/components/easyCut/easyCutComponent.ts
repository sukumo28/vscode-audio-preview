import "./easyCutComponent.css";
import { PostMessage, WebviewMessageType } from "../../../message";
import Component from "../../component";
import { EventType } from "../../events";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";
import { encodeToWav } from "../../encoder";

export default class EasyCutComponent extends Component {
  constructor(
    componentRootSelector: string,
    audioBuffer: AudioBuffer,
    analyzeSettingsService: AnalyzeSettingsService,
    postMessage: PostMessage,
  ) {
    super();

    const componentRoot = document.querySelector(componentRootSelector);

    componentRoot.innerHTML = `
      <div class="easyCut">
        <p>Cut the currently selected range and save it to a wav file (experimental)</p>
        <div>
          filename:
          <input class="js-easyCut-filename" type="text">.wav
        </div>
        <button class="easyCut__button js-easyCutButton-cut">cut</button>
      </div>
    `;

    const cutButton = componentRoot.querySelector(
      ".js-easyCutButton-cut",
    ) as HTMLButtonElement;

    const filenameInput = componentRoot.querySelector(
      ".js-easyCut-filename",
    ) as HTMLInputElement;
    filenameInput.value = `cut_${this.getTimeString()}`;

    this._addEventlistener(cutButton, EventType.CLICK, () => {
      const minIndex = Math.floor(
        analyzeSettingsService.minTime * audioBuffer.sampleRate,
      );
      const maxIndex = Math.floor(
        analyzeSettingsService.maxTime * audioBuffer.sampleRate,
      );

      const audioData: Float32Array[] = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        audioData.push(channelData.slice(minIndex, maxIndex));
      }

      const samples = encodeToWav(
        audioData,
        audioBuffer.sampleRate,
        audioBuffer.numberOfChannels,
      );

      const filename = this.checkAndReplaceFilename(filenameInput.value);

      postMessage({
        type: WebviewMessageType.WRITE_WAV,
        data: {
          filename: filename,
          samples,
        },
      });
    });
  }

  private checkAndReplaceFilename(filename: string): string {
    if (!filename) {
      return `cut_${this.getTimeString()}.wav`;
    }
    return filename.replace(/[<>:"/\\|?*]+/g, "_") + ".wav";
  }

  private getTimeString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hour = ("0" + date.getHours()).slice(-2);
    const minute = ("0" + date.getMinutes()).slice(-2);
    const second = ("0" + date.getSeconds()).slice(-2);
    return `${year}${month}${day}_${hour}${minute}${second}`;
  }
}

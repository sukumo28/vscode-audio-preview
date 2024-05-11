import { PostMessage, WebviewMessageType } from "../../../message";
import Component from "../../component";
import { EventType } from "../../events";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";
import { encodeToWav } from "../../encoder";
import { getNonce } from "../../../util";

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
        <button class="js-easyCutButton-cut">cut</button>
      </div>
    `;

    const cutButton = componentRoot.querySelector(
      ".js-easyCutButton-cut",
    ) as HTMLButtonElement;
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

      postMessage({
        type: WebviewMessageType.WRITE_WAV,
        data: {
          filename: `cut_${getNonce()}.wav`,
          samples,
        },
      });
    });
  }
}

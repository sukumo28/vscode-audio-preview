import "./figureInteractionComponent.css";
import { EventType } from "../../events";
import PlayerService from "../../services/playerService";
import Component from "../../component";

export default class FigureInteractionComponent extends Component {
  constructor(
    componentRootSelector: string,
    playerService: PlayerService,
    audioBuffer: AudioBuffer,
    minTime: number,
    maxTime: number,
  ) {
    super();
    const componentRoot = document.querySelector(componentRootSelector);

    // register seekbar on figures
    const visibleBar = document.createElement("div");
    visibleBar.className = "seekDiv";
    componentRoot.appendChild(visibleBar);

    const inputSeekbar = document.createElement("input");
    inputSeekbar.type = "range";
    inputSeekbar.className = "inputSeekBar";
    inputSeekbar.step = "0.00001";
    componentRoot.appendChild(inputSeekbar);

    this._addEventlistener(
      playerService,
      EventType.UPDATE_SEEKBAR,
      (e: CustomEventInit) => {
        const percentInFullRange = e.detail.value;
        const sec = (percentInFullRange * audioBuffer.duration) / 100;
        const percentInFigureRange =
          ((sec - minTime) / (maxTime - minTime)) * 100;
        if (percentInFigureRange < 0) {
          visibleBar.style.width = `0%`;
          return;
        }
        if (100 < percentInFigureRange) {
          visibleBar.style.width = `100%`;
          return;
        }
        visibleBar.style.width = `${percentInFigureRange}%`;
      },
    );

    this._addEventlistener(inputSeekbar, EventType.CHANGE, () => {
      const percentInFigureRange = Number(inputSeekbar.value);
      const sec = (percentInFigureRange / 100) * (maxTime - minTime) + minTime;
      const percentInFullRange = (sec / audioBuffer.duration) * 100;
      playerService.onSeekbarInput(percentInFullRange);
      inputSeekbar.value = "100";
    });
  }
}

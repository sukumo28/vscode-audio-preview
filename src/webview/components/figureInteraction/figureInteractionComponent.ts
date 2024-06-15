import "./figureInteractionComponent.css";
import { EventType } from "../../events";
import PlayerService from "../../services/playerService";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService, {
  AnalyzeSettingsProps,
  FrequencyScale,
} from "../../services/analyzeSettingsService";
import Component from "../../component";

export default class FigureInteractionComponent extends Component {
  constructor(
    componentRootSelector: string,
    onWaveformCanvas: boolean,
    playerService: PlayerService,
    analyzeService: AnalyzeService,
    analyseSettingsService: AnalyzeSettingsService,
    audioBuffer: AudioBuffer,
    settings: AnalyzeSettingsProps,
  ) {
    super();
    const componentRoot = document.querySelector(componentRootSelector);

    // register seekbar on figures
    const visibleBar = document.createElement("div");
    visibleBar.className = "visibleBar";
    componentRoot.appendChild(visibleBar);

    this._addEventlistener(
      playerService,
      EventType.UPDATE_SEEKBAR,
      (e: CustomEventInit) => {
        const percentInFullRange = e.detail.value;
        const sec = (percentInFullRange * audioBuffer.duration) / 100;
        const percentInFigureRange =
          ((sec - settings.minTime) / (settings.maxTime - settings.minTime)) *
          100;
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

    const userInputDiv = document.createElement("div");
    userInputDiv.className = "userInputDiv";
    componentRoot.appendChild(userInputDiv);

    let isDragging = false;
    let mouseDownX = 0;
    let mouseDownY = 0;
    let selectionDiv: HTMLDivElement | null = null;

    this._addEventlistener(
      userInputDiv,
      EventType.MOUSE_DOWN,
      (event: MouseEvent) => {
        /*
        apply selected range if isDrugging is already true.
        this condition occurs if user start dragging, move the mouse outside the figure, 
        release the mouse there, and then move the cursor over the figure again.
        */
        if (isDragging) {
          isDragging = false;
          if (selectionDiv) {
            componentRoot.removeChild(selectionDiv);
            selectionDiv = null;
          }
          const rect = userInputDiv.getBoundingClientRect();
          this.applySelectedRange(
            mouseDownX,
            mouseDownY,
            event.clientX,
            event.clientY,
            rect,
            onWaveformCanvas,
            settings,
            analyseSettingsService,
            analyzeService,
          );
          return;
        }

        mouseDownX = event.clientX;
        mouseDownY = event.clientY;

        // left click
        if (event.button === 0) {
          isDragging = true;
          // create a new div for the selection
          selectionDiv = document.createElement("div");
          selectionDiv.style.position = "absolute";
          selectionDiv.style.border = "1px solid red";
          selectionDiv.style.backgroundColor = "rgba(255, 0, 0, 0)";
          selectionDiv.style.pointerEvents = "none"; // to avoid interfering with the mouse events
          componentRoot.appendChild(selectionDiv);
          return;
        }

        // right click
        if (event.button === 2) {
          // reset the range to the default range
          analyseSettingsService.resetToDefaultTimeRange();
          analyseSettingsService.resetToDefaultAmplitudeRange();
          analyseSettingsService.resetToDefaultFrequencyRange();
          analyzeService.analyze();
        }
      },
    );

    this._addEventlistener(
      userInputDiv,
      EventType.CONTEXT_MENU,
      (event: MouseEvent) => {
        event.preventDefault();
      },
    );

    this._addEventlistener(
      userInputDiv,
      EventType.MOUSE_MOVE,
      (event: MouseEvent) => {
        if (!isDragging || !selectionDiv) {
          return;
        }
        const currentX = event.clientX;
        const currentY = event.clientY;
        const rect = userInputDiv.getBoundingClientRect();

        // draw selection range
        // note: direction of y-axis is top to bottom
        selectionDiv.style.left =
          Math.min(mouseDownX, currentX) - rect.left + "px";
        selectionDiv.style.top =
          Math.min(mouseDownY, currentY) - rect.top + "px";
        selectionDiv.style.width = Math.abs(mouseDownX - currentX) + "px";
        selectionDiv.style.height = Math.abs(mouseDownY - currentY) + "px";
      },
    );

    this._addEventlistener(
      userInputDiv,
      EventType.MOUSE_UP,
      (event: MouseEvent) => {
        if (!isDragging || !selectionDiv) {
          return;
        }
        isDragging = false;

        // Remove the selection div
        if (selectionDiv) {
          componentRoot.removeChild(selectionDiv);
          selectionDiv = null;
        }

        // calculate the position of the mouse up event
        const mouseUpX = event.clientX;
        const mouseUpY = event.clientY;
        const rect = userInputDiv.getBoundingClientRect();

        // treat as click if mouse moved less than threshold
        if (
          Math.abs(mouseDownX - mouseUpX) < 3 &&
          Math.abs(mouseDownY - mouseUpY) < 3
        ) {
          // start playing from the clicked position
          const xPercentInFigureRange =
            ((mouseUpX - rect.left) / rect.width) * 100;
          const sec =
            (xPercentInFigureRange / 100) *
              (settings.maxTime - settings.minTime) +
            settings.minTime;
          const percentInFullRange = (sec / audioBuffer.duration) * 100;
          playerService.onSeekbarInput(percentInFullRange);
          return;
        }

        // treat as drag
        this.applySelectedRange(
          mouseUpX,
          mouseUpY,
          mouseDownX,
          mouseDownY,
          rect,
          onWaveformCanvas,
          settings,
          analyseSettingsService,
          analyzeService,
        );
      },
    );
  }

  private applySelectedRange(
    mouseUpX: number,
    mouseUpY: number,
    mouseDownX: number,
    mouseDownY: number,
    rect: DOMRect,
    onWaveformCanvas: boolean,
    settings: AnalyzeSettingsProps,
    analyseSettingsService: AnalyzeSettingsService,
    analyzeService: AnalyzeService,
  ) {
    const minX = Math.min(mouseUpX, mouseDownX) - rect.left;
    const maxX = Math.max(mouseUpX, mouseDownX) - rect.left;
    const minY = Math.min(mouseUpY, mouseDownY) - rect.top;
    const maxY = Math.max(mouseUpY, mouseDownY) - rect.top;

    const timeRange = settings.maxTime - settings.minTime;
    const minTime = (minX / rect.width) * timeRange + settings.minTime;
    const maxTime = (maxX / rect.width) * timeRange + settings.minTime;
    analyseSettingsService.minTime = minTime;
    analyseSettingsService.maxTime = maxTime;

    // note: direction of y-axis is top to bottom
    if (onWaveformCanvas) {
      // WaveformCanvas
      const amplitudeRange = settings.maxAmplitude - settings.minAmplitude;
      const minAmplitude =
        (1 - maxY / rect.height) * amplitudeRange + settings.minAmplitude;
      const maxAmplitude =
        (1 - minY / rect.height) * amplitudeRange + settings.minAmplitude;
      analyseSettingsService.minAmplitude = minAmplitude;
      analyseSettingsService.maxAmplitude = maxAmplitude;
    } else {
      // SpectrogramCanvas      
      let minFrequency, maxFrequency, frequencyRange;
      switch (settings.frequencyScale) {
        case FrequencyScale.Linear:
          frequencyRange = settings.maxFrequency - settings.minFrequency;
          minFrequency = (1 - maxY / rect.height) * frequencyRange + settings.minFrequency;
          maxFrequency = (1 - minY / rect.height) * frequencyRange + settings.minFrequency;
          break;            
        case FrequencyScale.Log:
          frequencyRange = Math.log10(settings.maxFrequency) - Math.log10(settings.minFrequency);
          minFrequency = Math.pow(10, (1 - maxY / rect.height) * frequencyRange) + settings.minFrequency;
          maxFrequency = Math.pow(10, (1 - minY / rect.height) * frequencyRange) + settings.minFrequency;
          break;
        case FrequencyScale.Mel:
          frequencyRange = AnalyzeService.hzToMel(settings.maxFrequency) - AnalyzeService.hzToMel(settings.minFrequency);
          minFrequency = AnalyzeService.melToHz((1 - maxY / rect.height) * frequencyRange) + settings.minFrequency;
          maxFrequency = AnalyzeService.melToHz((1 - minY / rect.height) * frequencyRange) + settings.minFrequency;
          break;
      }                      
      analyseSettingsService.minFrequency = minFrequency;
      analyseSettingsService.maxFrequency = maxFrequency;
    }

    // analyze
    analyzeService.analyze();
  }
}

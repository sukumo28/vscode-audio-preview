import "./figureInteractionComponent.css";
import { EventType } from "../../events";
import PlayerService from "../../services/playerService";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService, {
  AnalyzeSettingsProps,
} from "../../services/analyzeSettingsService";
import Component from "../../component";

export default class FigureInteractionComponent extends Component {
  private selectionDiv: HTMLDivElement | null = null;
  private isDragging: boolean = false;
  private isTimeAxisOnly: boolean = false;
  private isValueAxisOnly: boolean = false;
  private mouseDownX: number = 0;
  private mouseDownY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;

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

    this._addEventlistener(
      userInputDiv,
      EventType.MOUSE_DOWN,
      (event: MouseEvent) => {
        /*
        apply selected range if isDrugging is already true.
        this condition occurs if user start dragging, move the mouse outside the figure, 
        release the mouse there, and then move the cursor over the figure again.
        */
        if (this.isDragging) {
          this.isDragging = false;
          if (this.selectionDiv) {
            componentRoot.removeChild(this.selectionDiv);
            this.selectionDiv = null;
          }
          const rect = userInputDiv.getBoundingClientRect();
          this.applySelectedRange(
            this.mouseDownX,
            this.mouseDownY,
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

        this.mouseDownX = event.clientX;
        this.mouseDownY = event.clientY;

        // left click
        if (event.button === 0) {
          this.isDragging = true;
          // create a new div for the selection
          this.selectionDiv = document.createElement("div");
          this.selectionDiv.style.position = "absolute";
          this.selectionDiv.style.border = "1px solid red";
          this.selectionDiv.style.backgroundColor = "rgba(255, 0, 0, 0)";
          this.selectionDiv.style.pointerEvents = "none"; // to avoid interfering with the mouse events
          componentRoot.appendChild(this.selectionDiv);
          return;
        }

        // right click
        if (event.button === 2) {
          // reset the range to the default range
          if (event.ctrlKey) {
            // reset time axis only
            analyseSettingsService.resetToDefaultTimeRange();
          } else if (event.shiftKey) {
            // reset value axis only
            analyseSettingsService.resetToDefaultAmplitudeRange();
            analyseSettingsService.resetToDefaultFrequencyRange();
          } else {
            // reset both axes
            analyseSettingsService.resetToDefaultTimeRange();
            analyseSettingsService.resetToDefaultAmplitudeRange();
            analyseSettingsService.resetToDefaultFrequencyRange();
          }
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
        if (!this.isDragging || !this.selectionDiv) {
          return;
        }
        this.currentX = event.clientX;
        this.currentY = event.clientY;
        this.drawSelectionDiv(userInputDiv);
      },
    );

    this._addEventlistener(
      userInputDiv,
      EventType.MOUSE_UP,
      (event: MouseEvent) => {
        if (!this.isDragging || !this.selectionDiv) {
          return;
        }
        this.isDragging = false;

        // Remove the selection div
        if (this.selectionDiv) {
          componentRoot.removeChild(this.selectionDiv);
          this.selectionDiv = null;
        }

        // calculate the position of the mouse up event
        const mouseUpX = event.clientX;
        const mouseUpY = event.clientY;
        const rect = userInputDiv.getBoundingClientRect();

        // treat as click if mouse moved less than threshold
        if (
          Math.abs(this.mouseDownX - mouseUpX) < 3 &&
          Math.abs(this.mouseDownY - mouseUpY) < 3
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
          this.mouseDownX,
          this.mouseDownY,
          rect,
          onWaveformCanvas,
          settings,
          analyseSettingsService,
          analyzeService,
        );
      },
    );

    // When the control key or shift key is pressed, even if the mouse is not moving,
    // if the selectuionDiv already exists, update the selection range.
    this._addEventlistener(
      window,
      EventType.KEY_DOWN,
      (event: KeyboardEvent) => {
        if (!this.isDragging || !this.selectionDiv) {
          return;
        }
        // ignore if pressed keys are not ctrl or shift
        if (!event.ctrlKey && !event.shiftKey) {
          return;
        }
        if (event.ctrlKey) {
          this.isTimeAxisOnly = true;
          this.isValueAxisOnly = false;
        }
        if (event.shiftKey) {
          this.isTimeAxisOnly = false;
          this.isValueAxisOnly = true;
        }
        this.drawSelectionDiv(userInputDiv);
      },
    );

    // When the control key or shift key is released, update flags about selection range.
    this._addEventlistener(window, EventType.KEY_UP, (event: KeyboardEvent) => {
      // ignore if released keys are not ctrl or shift
      if (event.key !== "Shift" && event.key !== "Control") {
        return;
      }
      this.isTimeAxisOnly = false;
      this.isValueAxisOnly = false;

      if (this.isDragging && this.selectionDiv) {
        this.drawSelectionDiv(userInputDiv);
      }
    });
  }

  private drawSelectionDiv(userInputDiv: HTMLDivElement) {
    const rect = userInputDiv.getBoundingClientRect();

    // draw selection range
    // note: direction of y-axis is top to bottom
    if (this.isTimeAxisOnly) {
      // select time axis only
      this.selectionDiv.style.left =
        Math.min(this.mouseDownX, this.currentX) - rect.left + "px";
      this.selectionDiv.style.top = "0%";
      this.selectionDiv.style.width =
        Math.abs(this.mouseDownX - this.currentX) + "px";
      this.selectionDiv.style.height = "100%";
    } else if (this.isValueAxisOnly) {
      // select value axis only
      this.selectionDiv.style.left = "0%";
      this.selectionDiv.style.top =
        Math.min(this.mouseDownY, this.currentY) - rect.top + "px";
      this.selectionDiv.style.width = "100%";
      this.selectionDiv.style.height =
        Math.abs(this.mouseDownY - this.currentY) + "px";
    } else {
      // select both axes
      this.selectionDiv.style.left =
        Math.min(this.mouseDownX, this.currentX) - rect.left + "px";
      this.selectionDiv.style.top =
        Math.min(this.mouseDownY, this.currentY) - rect.top + "px";
      this.selectionDiv.style.width =
        Math.abs(this.mouseDownX - this.currentX) + "px";
      this.selectionDiv.style.height =
        Math.abs(this.mouseDownY - this.currentY) + "px";
    }
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

    if (!this.isValueAxisOnly) {
      const timeRange = settings.maxTime - settings.minTime;
      const minTime = (minX / rect.width) * timeRange + settings.minTime;
      const maxTime = (maxX / rect.width) * timeRange + settings.minTime;
      analyseSettingsService.minTime = minTime;
      analyseSettingsService.maxTime = maxTime;
    }

    // note: direction of y-axis is top to bottom
    if (!this.isTimeAxisOnly) {
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
        const frequencyRange = settings.maxFrequency - settings.minFrequency;
        const minFrequency =
          (1 - maxY / rect.height) * frequencyRange + settings.minFrequency;
        const maxFrequency =
          (1 - minY / rect.height) * frequencyRange + settings.minFrequency;
        analyseSettingsService.minFrequency = minFrequency;
        analyseSettingsService.maxFrequency = maxFrequency;
      }
    }

    // analyze
    analyzeService.analyze();
  }
}

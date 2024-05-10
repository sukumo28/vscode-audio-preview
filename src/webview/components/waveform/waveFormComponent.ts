import "../../styles/figure.css";
import AnalyzeService from "../../services/analyzeService";
import { AnalyzeSettingsProps } from "../../services/analyzeSettingsService";

export default class WaveFormComponent {
  constructor(
    componentRootSelector: string,
    width: number,
    height: number,
    settings: AnalyzeSettingsProps,
    sampleRate: number,
    channelData: Float32Array,
    ch: number,
    numOfCh: number,
  ) {
    const componentRoot = document.querySelector(componentRootSelector);

    const canvasBox = document.createElement("div");
    canvasBox.className = "canvasBox";

    const canvas = document.createElement("canvas");
    canvas.className = "mainCanvas";
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "rgb(160,60,200)";
    canvasBox.appendChild(canvas);

    const axisCanvas = document.createElement("canvas");
    axisCanvas.className = "axisCanvas";
    axisCanvas.width = width;
    axisCanvas.height = height;
    const axisContext = axisCanvas.getContext("2d");
    axisContext.font = `12px Arial`;

    // draw horizontal axis
    const [niceT, digitT] = AnalyzeService.roundToNearestNiceNumber(
      (settings.maxTime - settings.minTime) / 10,
    );
    const dx = width / (settings.maxTime - settings.minTime);
    const t0 = Math.ceil(settings.minTime / niceT) * niceT;
    const numTAxis = Math.floor((settings.maxTime - settings.minTime) / niceT);
    for (let i = 0; i <= numTAxis; i++) {
      const t = t0 + niceT * i;
      const x = (t - settings.minTime) * dx;

      axisContext.fillStyle = "rgb(245,130,32)";
      if (width * (5 / 100) < x && x < width * (95 / 100)) {
        axisContext.fillText(`${t.toFixed(digitT)}`, x, 10);
      } // don't draw near the edge

      axisContext.fillStyle = "rgb(180,120,20)";
      for (let j = 0; j < height; j++) {
        axisContext.fillRect(x, j, 1, 1);
      }
    }

    // draw vertical axis
    const [niceA, digitA] = AnalyzeService.roundToNearestNiceNumber(
      (settings.maxAmplitude - settings.minAmplitude) /
        (10 * settings.waveformVerticalScale),
    );
    const dy = height / (settings.maxAmplitude - settings.minAmplitude);
    const a0 = Math.ceil(settings.minAmplitude / niceA) * niceA;
    const numAAxis = Math.floor(
      (settings.maxAmplitude - settings.minAmplitude) / niceA,
    );
    for (let i = 0; i <= numAAxis; i++) {
      const a = a0 + niceA * i;
      const y = height - (a - settings.minAmplitude) * dy;

      axisContext.fillStyle = "rgb(245,130,32)";
      if (12 < y && y < height) {
        axisContext.fillText(`${a.toFixed(digitA)}`, 4, y - 2);
      } // don't draw near the edge

      axisContext.fillStyle = "rgb(180,120,20)";
      if (12 < y && y < height) {
        // don't draw on the horizontal axis
        for (let j = 0; j < width; j++) {
          axisContext.fillRect(j, y, 1, 1);
        }
      }
    }

    canvasBox.appendChild(axisCanvas);
    componentRoot.appendChild(canvasBox);

    const startIndex = Math.floor(settings.minTime * sampleRate);
    const endIndex = Math.floor(settings.maxTime * sampleRate);
    // limit data size
    // thus, drawing waveform of long duration input can be done in about the same amount of time as short input
    const step = Math.ceil((endIndex - startIndex) / 200000);
    const data = channelData
      .slice(startIndex, endIndex)
      .filter((_, i) => i % step === 0);
    // draw waveform
    for (let i = 0; i < data.length; i++) {
      // convert data. this is not a normalization.
      // setting.maxAmplitude and setting.minAmplitude is not a min and max of data, but a figure's Y axis range.
      // data is converted to satisfy setting.maxAmplitude=1 and setting.minAmplitude=0
      // samples out of range is not displayed.
      const d =
        (data[i] - settings.minAmplitude) /
        (settings.maxAmplitude - settings.minAmplitude);

      const x = (i / data.length) * width;
      const y = height * (1 - d);
      context.fillRect(x, y, 1, 1);
    }

    // draw channel label
    if (numOfCh > 1) {
      let channelText = "";
      if (numOfCh === 2) {
        channelText = ch === 0 ? "Lch" : "Rch";
      } else {
        channelText = "ch" + String(ch + 1);
      }

      axisContext.font = `12px Arial`;
      axisContext.fillStyle = "rgb(220, 220, 220)";
      axisContext.fillText(channelText, 33, 10);
    }
  }
}

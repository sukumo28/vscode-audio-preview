import { AnalyzeSettingsProps } from "../../config";
import AnalyzeService from "../service/analyzeService";

export default class WaveFormComponent {
    private _analyzeService: AnalyzeService;

    constructor(parentID: string, analyzeService: AnalyzeService, settings: AnalyzeSettingsProps, sampleRate: number, ch: number) {
        const parent = document.getElementById(parentID);
        this._analyzeService = analyzeService;

        const width = 1800;
        const height = 600;

        const canvasBox = document.createElement("div");
        canvasBox.className = "canvas-box";

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvasBox.appendChild(canvas);

        const axisCanvas = document.createElement("canvas");
        axisCanvas.className = "axis-canvas";
        axisCanvas.width = width;
        axisCanvas.height = height;
        canvasBox.appendChild(axisCanvas);

        parent.appendChild(canvasBox);

        this.drawLinearAxis(axisCanvas, settings);
        this.drawLinearSpectrogram(canvas, sampleRate, settings, ch);
    }

    private drawLinearAxis(axisCanvas: HTMLCanvasElement, settings: AnalyzeSettingsProps) {
        const axisContext = axisCanvas.getContext("2d");
        const width = axisCanvas.width;
        const height = axisCanvas.height;

        axisContext.font = `20px Arial`;
        for (let i = 0; i < 10; i++) {
            axisContext.fillStyle = "rgb(245,130,32)";
            const x = Math.round(i * width / 10);
            const t = i * (settings.maxTime - settings.minTime) / 10 + settings.minTime;
            if (i !== 0) axisContext.fillText(`${(t).toFixed(2)}`, x, 18);
            const y = Math.round(i * height / 10);
            const f = (10 - i) * (settings.maxFrequency - settings.minFrequency) / 10 + settings.minFrequency;
            axisContext.fillText(`${Math.trunc(f)}`, 4, y - 4);

            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < height; j++) axisContext.fillRect(x, j, 2, 2);
            for (let j = 0; j < width; j++) axisContext.fillRect(j, y, 2, 2);
        }
    }

    private drawLinearSpectrogram(canvas: HTMLCanvasElement, sampleRate: number, settings: AnalyzeSettingsProps, ch: number) {
        const context = canvas.getContext("2d", { alpha: false });
        const spectrogram = this._analyzeService.getSpectrogram(ch, settings);
        const width = canvas.width;
        const height = canvas.height;
        
        const wholeSampleNum = (settings.maxTime - settings.minTime) * sampleRate;
        const rectWidth = width * settings.hopSize / wholeSampleNum;
        
        const df = sampleRate / settings.windowSize;
        const minFreqIndex = Math.floor(settings.minFrequency / df);
        const maxFreqIndex = Math.floor(settings.maxFrequency / df);
        const rectHeight = height / (maxFreqIndex - minFreqIndex);

        for (let i = 0; i < spectrogram.length; i++) {
            const x = i * rectWidth;
            for (let j = 0; j < spectrogram[i].length; j++) {
                const y = height - (j + 1) * rectHeight;
                const value = spectrogram[i][j];
                context.fillStyle = this._analyzeService.getSpectrogramColor(value, settings.spectrogramAmplitudeRange);
                context.fillRect(x, y, rectWidth, rectHeight);
            }
        }
    }
}

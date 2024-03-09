import { AnalyzeSettingsProps } from '../service/analyzeSettingsService';

export default class WaveFormComponent {

    constructor(parentID: string, settings: AnalyzeSettingsProps, sampleRate: number, channelData: Float32Array) {
        const parent = document.getElementById(parentID);
        const height = 200;
        const width = 1000;

        const canvasBox = document.createElement("div");
        canvasBox.className = "canvas-box";

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        context.fillStyle = "rgb(160,60,200)";
        canvasBox.appendChild(canvas);

        const axisCanvas = document.createElement("canvas");
        axisCanvas.className = "axis-canvas";
        axisCanvas.width = width;
        axisCanvas.height = height;
        const axisContext = axisCanvas.getContext("2d");
        axisContext.font = `12px Arial`;
        for (let i = 0; i < 10; i++) {
            axisContext.fillStyle = "rgb(245,130,32)";
            const x = Math.round(i * width / 10);
            const t = i * (settings.maxTime - settings.minTime) / 10 + settings.minTime;
            if (i !== 0) axisContext.fillText(`${(t).toFixed(2)}`, x, 10); // skip first label
            const y = Math.round((i + 1) * height / 10);
            const a = (i + 1) * (settings.minAmplitude - settings.maxAmplitude) / 10 + settings.maxAmplitude;
            axisContext.fillText(`${(a).toFixed(2)}`, 4, y - 2);

            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < height; j++) axisContext.fillRect(x, j, 1, 1);
            for (let j = 0; j < width; j++) axisContext.fillRect(j, y, 1, 1);
        }
        canvasBox.appendChild(axisCanvas);

        parent.appendChild(canvasBox);

        const startIndex = Math.floor(settings.minTime * sampleRate);
        const endIndex = Math.floor(settings.maxTime * sampleRate);
        // limit data size
        // thus, drawing waveform of long duration input can be done in about the same amount of time as short input
        const step = Math.ceil((endIndex - startIndex) / 200000);
        const data = channelData.slice(startIndex, endIndex).filter((_, i) => i % step === 0);
        // draw waveform
        for (let i = 0; i < data.length; i++) {
            // convert data. this is not a normalization.
            // setting.maxAmplitude and setting.minAmplitude is not a min and max of data, but a figure's Y axis range.
            // data is converted to satisfy setting.maxAmplitude=1 and setting.minAmplitude=0
            // samples out of range is not displayed. 
            const d = (data[i] - settings.minAmplitude) / (settings.maxAmplitude - settings.minAmplitude);

            const x = i / data.length * width;
            const y = height * (1 - d);
            context.fillRect(x, y, 1, 1);
        }
    }

}

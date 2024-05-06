import AnalyzeService from '../service/analyzeService';
import { AnalyzeSettingsProps } from '../service/analyzeSettingsService';

export default class WaveFormComponent {

    constructor(parentID: string, width: number, height: number, settings: AnalyzeSettingsProps, sampleRate: number, channelData: Float32Array, ch: number, numOfCh: number) {
        const parent = document.getElementById(parentID);

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

        // draw horizontal axis
        const [nice_t, digit_t]: [number, number] = AnalyzeService.roundToNearestNiceNumber((settings.maxTime - settings.minTime) / 10);
        const x_by_t = width / (settings.maxTime - settings.minTime);
        let t = settings.minTime;
        let loop_cnt = 0;   // safe guard
        do {
            t = Math.round(t / nice_t) * nice_t;
            let x = (t - settings.minTime) * x_by_t;

            axisContext.fillStyle = "rgb(245,130,32)";
            if (width * (5 / 100) < x  && x < width * (95 / 100)) axisContext.fillText(`${(t).toFixed(digit_t)}`, x, 10);     // don't draw near the edge

            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < height; j++) axisContext.fillRect(x, j, 1, 1);

            t += nice_t
        } while (t < settings.maxTime && loop_cnt++ < 100);
        
        // draw vertical axis
        const [nice_a, digit_a]: [number, number] = AnalyzeService.roundToNearestNiceNumber((settings.maxAmplitude - settings.minAmplitude) / (10 * settings.waveformVerticalScale));
        const y_by_a = height / (settings.maxAmplitude - settings.minAmplitude);
        let a = settings.minAmplitude;
        do {
            a = Math.round(a / nice_a) * nice_a;

            axisContext.fillStyle = "rgb(245,130,32)";
            const y = height - ((a - settings.minAmplitude) * y_by_a);
            if (12 < y && y < height) axisContext.fillText(`${(a).toFixed(digit_a)}`, 4, y - 2);    // don't draw near the edge

            axisContext.fillStyle = "rgb(180,120,20)";
            if (12 < y && y < height) {   // don't draw on the horizontal axis
                for (let j = 0; j < width; j++) axisContext.fillRect(j, y, 1, 1);
            }

            a += nice_a;
        } while (a < settings.maxAmplitude);

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

        // draw channel label
        if (numOfCh > 1) {
            let channelText = "";
            if (numOfCh == 2) {
                channelText = ch == 0 ? "Lch" : "Rch";
            } else {
                channelText = "ch" + String(ch + 1)
            }

            axisContext.font = `12px Arial`;
            axisContext.fillStyle = "rgb(220, 220, 220)";
            axisContext.fillText(channelText, 33, 10);
        }
    }
}

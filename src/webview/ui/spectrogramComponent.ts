import { AnalyzeSettingsProps } from '../service/analyzeSettingsService';
import AnalyzeService from "../service/analyzeService";
import { FrequencyScale } from "../service/analyzeSettingsService";

export default class WaveFormComponent {
    private _analyzeService: AnalyzeService;

    constructor(parentID: string, width: number, height: number, analyzeService: AnalyzeService, settings: AnalyzeSettingsProps, sampleRate: number, ch: number, numOfCh: number) {
        const parent = document.getElementById(parentID);
        this._analyzeService = analyzeService;

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

        switch (settings.frequencyScale) {
            case FrequencyScale.Linear:
                this.drawLinearAxis(axisCanvas, settings, ch, numOfCh);
                this.drawLinearSpectrogram(canvas, sampleRate, settings, ch);
                break;
            case FrequencyScale.Log:
                /*
                 if minFrequency = 0, logscaled minimum value is log10(Number.EPSILON)
                 however, in this case the values are too small, making the graph less readable 
                 so set minFrequency = 1
                */
                if (settings.minFrequency < 1) {settings.minFrequency = 1;}
                this.drawLogAxis(axisCanvas, settings, ch, numOfCh);
                this.drawLogSpectrogram(canvas, sampleRate, settings, ch);
                break;
            case FrequencyScale.Mel:
                this.drawMelAxis(axisCanvas, settings, ch, numOfCh);
                this.drawMelSpectrogram(canvas, sampleRate, settings, ch);
                break;
        }
    }

    private drawLinearAxis(axisCanvas: HTMLCanvasElement, settings: AnalyzeSettingsProps, ch: number, numOfCh: number) {
        // draw horizontal axis
        this.drawTimeAxis(axisCanvas, settings);

        // draw vertical axis
        const axisContext = axisCanvas.getContext("2d");
        const width = axisCanvas.width;
        const height = axisCanvas.height;   
        axisContext.font = `20px Arial`;

        const minFreq = settings.minFrequency;
        const maxFreq = settings.maxFrequency;
        const scale = (maxFreq - minFreq) / height;        
        const numAxes = Math.round(10 * settings.spectrogramVerticalScale);
        for (let i = 0; i < numAxes; i++) {
            axisContext.fillStyle = "rgb(245,130,32)";
            const freq = minFreq + i * (maxFreq - minFreq) / numAxes;
            const y = height - (freq - minFreq) / scale;
            axisContext.fillText(`${Math.trunc(freq)}`, 4, y - 4);

            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < width; j++) {axisContext.fillRect(j, y, 2, 2);}
        }

        // draw channel label
        this.drawChannelLabel(axisCanvas, ch, numOfCh);
    }

    private drawLinearSpectrogram(canvas: HTMLCanvasElement, sampleRate: number, settings: AnalyzeSettingsProps, ch: number) {
        const context = canvas.getContext("2d", { alpha: false });
        const spectrogram = this._analyzeService.getSpectrogram(ch, settings);
        const width = canvas.width;
        const height = canvas.height;
        
        const wholeSampleNum = (settings.maxTime - settings.minTime) * sampleRate;
        const rectWidth = width * settings.hopSize / wholeSampleNum;
        const rectHeight = height / spectrogram[0].length;

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

    private drawLogAxis(axisCanvas: HTMLCanvasElement, settings: AnalyzeSettingsProps, ch: number, numOfCh: number) {
        // draw horizontal axis
        this.drawTimeAxis(axisCanvas, settings);

        // draw vertical axis    
        const axisContext = axisCanvas.getContext("2d");
        const width = axisCanvas.width;
        const height = axisCanvas.height;
        axisContext.font = `20px Arial`;
    
        const logMin = Math.log10(settings.minFrequency + Number.EPSILON);
        const logMax = Math.log10(settings.maxFrequency + Number.EPSILON);
        const scale = (logMax - logMin) / height;
        const numAxes = Math.round(10 * settings.spectrogramVerticalScale);
        for (let i = 0; i < numAxes; i++) {
            axisContext.fillStyle = "rgb(245,130,32)";
    
            // Convert the frequency to the logarithmic scale
            const logFreq = logMin + i * (logMax - logMin) / numAxes;
            const f = Math.pow(10, logFreq);
            const y = height - (logFreq - logMin) / scale;
            axisContext.fillText(`${Math.trunc(f)}`, 4, y - 4);
    
            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < width; j++) {axisContext.fillRect(j, y, 2, 2);}
        }

        // draw channel label
        this.drawChannelLabel(axisCanvas, ch, numOfCh);
    }

    private drawLogSpectrogram(canvas: HTMLCanvasElement, sampleRate: number, settings: AnalyzeSettingsProps, ch: number) {
        const context = canvas.getContext("2d", { alpha: false });
        const spectrogram = this._analyzeService.getSpectrogram(ch, settings);
        const width = canvas.width;
        const height = canvas.height;
        
        const wholeSampleNum = (settings.maxTime - settings.minTime) * sampleRate;
        const rectWidth = width * settings.hopSize / wholeSampleNum;
        
        const df = sampleRate / settings.windowSize;
        // calculate the height of each frequency band in the logarithmic scale
        const logMin = Math.log10(settings.minFrequency + Number.EPSILON);
        const logMax = Math.log10(settings.maxFrequency + Number.EPSILON);
        const scale = (logMax - logMin) / height;
    
        for (let i = 0; i < spectrogram.length; i++) {
            const x = i * rectWidth;
            for (let j = 0; j < spectrogram[i].length; j++) {
                // convert the frequency index to the logarithmic scale
                const freq = j * df;
                const logFreq = Math.log10(freq + Number.EPSILON);
                const logPrevFreq = Math.log10((j - 1) * df + Number.EPSILON);
                const y = height - (logFreq - logMin) / scale;
                const rectHeight = (logFreq - logPrevFreq) / scale;
    
                const value = spectrogram[i][j];
                context.fillStyle = this._analyzeService.getSpectrogramColor(value, settings.spectrogramAmplitudeRange);
                context.fillRect(x, y, rectWidth, rectHeight);
            }
        }
    }

    private drawMelAxis(axisCanvas: HTMLCanvasElement, settings: AnalyzeSettingsProps, ch: number, numOfCh: number) {
        // draw horizontal axis
        this.drawTimeAxis(axisCanvas, settings);
        
        // draw vertical axis
        const axisContext = axisCanvas.getContext("2d");
        const width = axisCanvas.width;
        const height = axisCanvas.height;
        axisContext.font = `20px Arial`;

        const numAxes = Math.round(10 * settings.spectrogramVerticalScale);        
        for (let i = 0; i < numAxes; i++) {
            axisContext.fillStyle = "rgb(245,130,32)";
            const y = Math.round(i * height / numAxes);
            const maxMel = this._analyzeService.hzToMel(settings.maxFrequency);
            const minMel = this._analyzeService.hzToMel(settings.minFrequency);
            const mel = (numAxes - i) * (maxMel - minMel) / numAxes + minMel;
            const f = this._analyzeService.melToHz(mel);
            axisContext.fillText(`${Math.trunc(f)}`, 4, y - 4);
    
            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < width; j++) {axisContext.fillRect(j, y, 2, 2);}
        }

        // draw channel label
        this.drawChannelLabel(axisCanvas, ch, numOfCh);
    }

    private drawMelSpectrogram(canvas: HTMLCanvasElement, sampleRate: number, settings: AnalyzeSettingsProps, ch: number) {
        const context = canvas.getContext("2d", { alpha: false });
        const spectrogram = this._analyzeService.getMelSpectrogram(ch, settings);
        const width = canvas.width;
        const height = canvas.height;
        
        const wholeSampleNum = (settings.maxTime - settings.minTime) * sampleRate;
        const rectWidth = width * settings.hopSize / wholeSampleNum;
        const rectHeight = height / spectrogram[0].length;
    
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

    private drawTimeAxis(axisCanvas: HTMLCanvasElement, settings: AnalyzeSettingsProps) {
        const axisContext = axisCanvas.getContext("2d");
        const width = axisCanvas.width;
        const height = axisCanvas.height;
        axisContext.font = `20px Arial`;

        const [niceT, digit] = AnalyzeService.roundToNearestNiceNumber((settings.maxTime - settings.minTime) / 10);
        const dx = width / (settings.maxTime - settings.minTime);
        const t0 = Math.ceil(settings.minTime / niceT) * niceT;
        const numAxis = Math.floor((settings.maxTime - settings.minTime) / niceT);
        for (let i = 0; i <= numAxis; i++) {
            const t = t0 + niceT * i;
            const x = (t - settings.minTime) * dx;

            axisContext.fillStyle = "rgb(245,130,32)";
            if (width * (5 / 100) < x  && x < width * (95 / 100)) {axisContext.fillText(`${(t).toFixed(digit)}`, x, 18);}     // don't draw near the edge

            axisContext.fillStyle = "rgb(180,120,20)";
            for (let j = 0; j < height; j++) {axisContext.fillRect(x, j, 1, 1);}
        }
    }

    private drawChannelLabel(axisCanvas: HTMLCanvasElement, ch: number, numOfCh: number) {
        const axisContext = axisCanvas.getContext("2d");
        axisContext.font = `20px Arial`;

        if (numOfCh > 1) {
            let channelText = "";
            if (numOfCh == 2) {
                channelText = ch == 0 ? "Lch" : "Rch";
            } else {
                channelText = "ch" + String(ch + 1);
            }

            axisContext.fillStyle = "rgb(220, 220, 220)";
            axisContext.fillText(channelText, 60, 18);
        }        
    }
}

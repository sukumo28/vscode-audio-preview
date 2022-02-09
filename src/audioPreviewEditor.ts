import * as vscode from "vscode";
import * as path from "path";
import { Disposable, disposeAll } from "./dispose";
import { getNonce } from "./util";
import {
    AnalyzeDefault,
    AnalyzeSettings,
    ExtDataData,
    ExtInfoData,
    ExtMessage,
    ExtMessageType, ExtPrepareData, ExtSpectrogramData, WebviewDataData,
    WebviewErrorData,
    WebviewMessage, WebviewMessageType, WebviewSpectrogramData,
} from "./message";
import { WaveFile } from 'wavefile';
import Ooura from "ooura";

class AudioPreviewDocument extends Disposable implements vscode.CustomDocument {

    static async create(
        uri: vscode.Uri,
        backupId: string | undefined,
    ): Promise<AudioPreviewDocument | PromiseLike<AudioPreviewDocument>> {
        // If we have a backup, read that. Otherwise read the resource from the workspace
        const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
        const fileData = await AudioPreviewDocument.readFile(dataFile);
        try {
            const wav = new WaveFile(fileData);
            return new AudioPreviewDocument(uri, wav);
        } catch (err: any) {
            vscode.window.showErrorMessage(err.message);
            return new AudioPreviewDocument(uri, undefined);
        }
    }

    private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        if (uri.scheme === 'untitled') {
            return new Uint8Array();
        }
        return vscode.workspace.fs.readFile(uri);
    }

    private readonly _uri: vscode.Uri;
    private _documentData: any;
    private _fsWatcher: vscode.FileSystemWatcher;

    private constructor (
        uri: vscode.Uri,
        initialContent: any
    ) {
        super();
        this._uri = uri;
        this._documentData = initialContent;
        this._fsWatcher = vscode.workspace.createFileSystemWatcher(uri.fsPath, true, false, true);
        this.onDidChange = this._fsWatcher.onDidChange;
    }

    public get uri() { return this._uri; }

    public onDidChange: vscode.Event<vscode.Uri>;

    public wavHeader(): ExtInfoData {
        if (!this._documentData) return;

        const fmt = this._documentData.fmt;
        return {
            audioFormat: fmt.audioFormat,
            numChannels: fmt.numChannels,
            sampleRate: fmt.sampleRate,
            bitsPerSample: fmt.bitsPerSample,
            chunkSize: this._documentData.chunkSize,
        };
    }

    public prepareData(): ExtPrepareData {
        try {
            // decompose
            switch (this._documentData.fmt.audioFormat) {
                case 1:
                case 3:
                    break;

                case 6:
                    this._documentData.fromALaw();
                    break;

                case 7:
                    this._documentData.fromMuLaw();
                    break;

                case 17:
                    this._documentData.fromIMAADPCM();
                    break;

                default:
                    throw new Error(`Unsupported audio format: ${this._documentData.fmt.audioFormat}`);
            }

            // load 
            const numberOfChannels = this._documentData.fmt.numChannels;
            let samples = this._documentData.getSamples(false, Float32Array);
            if (numberOfChannels === 1) {
                samples = [samples];
            }
            this._documentData.samples = samples;

            // calc duration
            const sampleRate = this._documentData.fmt.sampleRate;
            const length = samples[0].length;
            const duration = length / sampleRate;

            const config = vscode.workspace.getConfiguration("WavPreview");
            const analyzeDefault = config.get("analyzeDefault") as AnalyzeDefault;

            return {
                sampleRate,
                numberOfChannels,
                length,
                duration,
                analyzeDefault
            };

        } catch (err: any) {
            vscode.window.showErrorMessage(err.message);
            return;
        }
    }

    // you have to prepareData before calling wavData
    public wavData(start: number, end: number): ExtDataData {
        try {
            const chNum = this._documentData.fmt.numChannels;
            const samples = new Array(chNum);
            for (let ch = 0; ch < chNum; ch++) {
                samples[ch] = this._documentData.samples[ch].slice(start, end);
            }

            // convert pcm to float32
            if (this._documentData.fmt.audioFormat === 1) {
                // 2 ^ (bitDepth - 1)
                const max = 1 << (this._documentData.fmt.bitsPerSample - 1);

                for (let ch = 0; ch < chNum; ch++) {
                    for (let i = 0; i < samples[ch].length; i++) {
                        const v = samples[ch][i];
                        samples[ch][i] = v < 0 ? v / max : v / (max - 1);
                    }
                }
            }

            return {
                samples,
                length: samples[0].length,
                numberOfChannels: chNum,
                start,
                end,
                wholeLength: this._documentData.samples[0].length
            };

        } catch (err: any) {
            vscode.window.showErrorMessage(err.message);
            return;
        }
    }

    public spectrogram(ch: number, start: number, end: number, settings: AnalyzeSettings): ExtSpectrogramData {
        try {
            const spectrogram = [];
            const fs = this._documentData.fmt.sampleRate;

            const windowSize = settings.windowSize;
            const window = [];
            for (let i = 0; i < windowSize; i++) {
                window.push(0.5 - 0.5 * Math.cos(2 * Math.PI * i / windowSize));
            }

            const df = fs / windowSize;
            const minIndex = Math.floor(settings.minFrequency / df);
            const maxIndex = Math.floor(settings.maxFrequency / df);

            const ooura = new Ooura(windowSize, { type: "real", radix: 4 });

            const data = this._documentData.samples[ch];
            const loopEnd = end < data.length ? end : data.length;
            for (let i = start; i < loopEnd; i += settings.hopSize) {
                // i is center of the window
                const s = i - windowSize / 2, t = i + windowSize / 2;
                const ss = s > 0 ? s : 0, tt = t < data.length ? t : data.length;
                const sg = ss - s, tg = t - tt;
                const d = [];
                d.push(...new Array(sg).fill(0));
                d.push(...data.slice(ss, tt));
                d.push(...new Array(tg).fill(0));

                const dd = ooura.scalarArrayFactory();
                for (let j = 0; j < dd.length; j++) {
                    dd[j] = d[j] * window[j];
                }

                const re = ooura.vectorArrayFactory();
                const im = ooura.vectorArrayFactory();
                ooura.fft(dd.buffer, re.buffer, im.buffer);

                const ps = [];
                let maxValue = Number.EPSILON;
                for (let j = minIndex; j < maxIndex; j++) {
                    const v = re[j] * re[j] + im[j] * im[j];
                    ps.push(v);
                    if (maxValue < v) maxValue = v;
                }
                for (let j = 0; j < ps.length; j++) {
                    ps[j] = 20 * Math.log10(ps[j] / maxValue + Number.EPSILON);
                }
                spectrogram.push(ps);
            }

            return {
                channel: ch,
                spectrogram,
                start,
                end,
                settings
            };

        } catch (err: any) {
            vscode.window.showErrorMessage(err.message);
            return {
                channel: ch,
                spectrogram: [[]],
                start,
                end,
                settings
            };
        }
    }

    public async reload() {
        const fileData = await AudioPreviewDocument.readFile(this._uri);
        try {
            this._documentData = new WaveFile(fileData);
        } catch (err: any) {
            vscode.window.showErrorMessage(err.message);
            this._documentData = undefined;
        }
    }

    private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
    public readonly onDidDispose = this._onDidDispose.event;

    /**
     * Called by VS Code when there are no more references to the document.
     * 
     * This happens when all editors for it have been closed.
     */
    dispose(): void {
        this._onDidDispose.fire();
        super.dispose();
    }
}

export class AudioPreviewEditorProvider implements vscode.CustomReadonlyEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            AudioPreviewEditorProvider.viewType,
            new AudioPreviewEditorProvider(context),
            {
                supportsMultipleEditorsPerDocument: false,
                webviewOptions: {
                    retainContextWhenHidden: true,
                }
            }
        );
    }

    private static readonly viewType = 'wavPreview.audioPreview';

    private readonly webviews = new WebviewCollection();

    constructor (
        private readonly _context: vscode.ExtensionContext
    ) { }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: { backupId?: string },
        _token: vscode.CancellationToken
    ): Promise<AudioPreviewDocument> {
        const document: AudioPreviewDocument = await AudioPreviewDocument.create(
            uri,
            openContext.backupId
        );

        const listeners: vscode.Disposable[] = [];

        listeners.push(document.onDidChange(async (e) => {
            await document.reload();
            for (const webviewPanel of this.webviews.get(document.uri)) {
                this.postMessage(webviewPanel.webview, {
                    type: ExtMessageType.Reload
                });
            }
        }));

        document.onDidDispose(() => disposeAll(listeners));

        return document;
    }

    async resolveCustomEditor(
        document: AudioPreviewDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Add the webview to our internal set of active webviews
        this.webviews.add(document.uri, webviewPanel);

        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Wait for the webview to be properly ready before we init
        webviewPanel.webview.onDidReceiveMessage((e: WebviewMessage) => {
            switch (e.type) {
                case WebviewMessageType.Ready: {
                    this.postMessage(webviewPanel.webview, {
                        type: ExtMessageType.Info,
                        data: {
                            ...document.wavHeader(),
                            isTrusted: vscode.workspace.isTrusted
                        },
                    });
                    break;
                }

                case WebviewMessageType.Prepare: {
                    this.postMessage(webviewPanel.webview, {
                        type: ExtMessageType.Prepare,
                        data: document.prepareData()
                    });
                    break;
                }

                case WebviewMessageType.Data: {
                    const webviewData = e.data as WebviewDataData;
                    const data = document.wavData(webviewData.start, webviewData.end);

                    // play audio automatically after first data message 
                    // if WapPreview.autoPlay is true
                    if (webviewData.start === 0) {
                        const config = vscode.workspace.getConfiguration("WavPreview");
                        data.autoPlay = config.get("autoPlay");
                    }

                    // analyze automatically
                    if (data.wholeLength <= data.end) {
                        const config = vscode.workspace.getConfiguration("WavPreview");
                        data.autoAnalyze = config.get("autoAnalyze");
                    }

                    this.postMessage(webviewPanel.webview, {
                        type: ExtMessageType.Data,
                        data: data
                    });

                    break;
                }

                case WebviewMessageType.Spectrogram: {
                    const webviewData = e.data as WebviewSpectrogramData;
                    this.postMessage(webviewPanel.webview, {
                        type: ExtMessageType.Spectrogram,
                        data: document.spectrogram(webviewData.channel, webviewData.start, webviewData.end, webviewData.settings)
                    });
                    break;
                }

                case WebviewMessageType.Error: {
                    const webviewData = e.data as WebviewErrorData;
                    vscode.window.showErrorMessage(webviewData.message);
                }
            }
        });
    }

    private postMessage(webview: vscode.Webview, message: ExtMessage) {
        webview.postMessage(message);
    }

    /**
     * Get the static HTML used for in our editor's webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this._context.extensionPath, 'dist', 'audioPreview.js')
        ));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this._context.extensionPath, 'dist', 'vscode.css')
        ));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this._context.extensionPath, 'dist', 'audioPreview.css')
        ));

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return /* html */`
            <!DOCTYPE html>
			<html lang="en">
            <head>
                <meta charset="UTF-8">
                
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                
                <link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleMainUri}" rel="stylesheet" />
                
                <title>Wav Preview</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
			</html>
        `;
    }
}

/**
 * Tracks all webviews.
 */
class WebviewCollection {

    private readonly _webviews = new Set<{
        readonly resource: string;
        readonly webviewPanel: vscode.WebviewPanel;
    }>();

    /**
     * Get all known webviews for a given uri.
     */
    public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
        const key = uri.toString();
        for (const entry of this._webviews) {
            if (entry.resource === key) {
                yield entry.webviewPanel;
            }
        }
    }

    /**
     * Add a new webview to the collection.
     */
    public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
        const entry = { resource: uri.toString(), webviewPanel };
        this._webviews.add(entry);

        webviewPanel.onDidDispose(() => {
            this._webviews.delete(entry);
        });
    }
}
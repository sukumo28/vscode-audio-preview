import * as vscode from "vscode";
import { Disposable, disposeAll } from "./dispose";
import { getNonce } from "./util";
import { AnalyzeDefault, AnalyzeSettings } from "./analyzeSettings";
import { ExtDataData, ExtInfoData, ExtMessage, ExtMessageType, ExtPrepareData, ExtSpectrogramData, WebviewMessage, WebviewMessageType } from "./message";
import documentData from "./documentData";

class AudioPreviewDocument extends Disposable implements vscode.CustomDocument {

    static async create(
        uri: vscode.Uri,
        backupId: string | undefined
    ): Promise<AudioPreviewDocument | PromiseLike<AudioPreviewDocument>> {
        // If we have a backup, read that. Otherwise read the resource from the workspace
        const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
        const fileData = await AudioPreviewDocument.readFile(dataFile);
        try {
            const decoder = await documentData.create(fileData);
            return new AudioPreviewDocument(uri, decoder);
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
    private _documentData: documentData;
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

    public audioInfo(): ExtInfoData {
        this._documentData.readAudioInfo();
        return {
            encoding: this._documentData.encoding,
            format: this._documentData.format,
            numChannels: this._documentData.numChannels,
            sampleRate: this._documentData.sampleRate,
            fileSize: this._documentData.fileSize,
        };
    }

    public prepareData(): ExtPrepareData {
        // execute decode
        this._documentData.decode();

        // read config
        const config = vscode.workspace.getConfiguration("WavPreview");
        const analyzeDefault = config.get("analyzeDefault") as AnalyzeDefault;

        return {
            sampleRate: this._documentData.sampleRate,
            numberOfChannels: this._documentData.numChannels,
            length: this._documentData.length,
            duration: this._documentData.duration,
            analyzeDefault
        };
    }

    public audioData(start: number, end: number): ExtDataData {
        const samples = new Array(this._documentData.numChannels);
        for (let ch = 0; ch < this._documentData.numChannels; ch++) {
            samples[ch] = this._documentData.samples[ch].slice(start, end);
        }

        return {
            samples,
            length: samples[0].length,
            numberOfChannels: this._documentData.numChannels,
            start,
            end,
            wholeLength: this._documentData.samples[0].length
        };
    }

    public makeSpectrogram(ch: number, settings: AnalyzeSettings) {
        this._documentData.makeSpectrogram(ch, settings);
    }

    public spectrogram(ch: number, startBlockIndex: number, blockSize: number, settings: AnalyzeSettings): ExtSpectrogramData {
        const spectrogram = this._documentData.spectrogram[ch].slice(startBlockIndex, startBlockIndex + blockSize);

        return {
            channel: ch,
            isEnd: this._documentData.spectrogram[ch].length <= startBlockIndex + blockSize,
            startBlockIndex,
            endBlockIndex: startBlockIndex + blockSize,
            spectrogram,
            settings
        };
    }

    public async reload() {
        const fileData = await AudioPreviewDocument.readFile(this._uri);
        try {
            this._documentData.dispose();
            this._documentData = await documentData.create(fileData);
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
        this._documentData.dispose();
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
        webviewPanel.webview.onDidReceiveMessage((msg: WebviewMessage) => {
            try {
                this.onReceiveMessage(msg, webviewPanel, document)
            } catch (err) {
                vscode.window.showErrorMessage(err.message);
            }
        });
    }

    private onReceiveMessage(msg: WebviewMessage, webviewPanel: vscode.WebviewPanel, document: AudioPreviewDocument) {
        switch (msg.type) {
            case WebviewMessageType.Ready: {
                this.postMessage(webviewPanel.webview, {
                    type: ExtMessageType.Info,
                    data: {
                        isTrusted: vscode.workspace.isTrusted,
                        ...document.audioInfo(),
                    }
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
                const data = document.audioData(msg.data.start, msg.data.end);

                // play audio automatically after first data message 
                // if WapPreview.autoPlay is true
                if (msg.data.start === 0) {
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
                    data
                });

                break;
            }

            case WebviewMessageType.MakeSpectrogram: {
                document.makeSpectrogram(msg.data.channel, msg.data.settings);
                this.postMessage(webviewPanel.webview, {
                    type: ExtMessageType.MakeSpectrogram,
                    data: { channel: msg.data.channel, settings: msg.data.settings }
                });
                break;
            }

            case WebviewMessageType.Spectrogram: {
                this.postMessage(webviewPanel.webview, {
                    type: ExtMessageType.Spectrogram,
                    data: document.spectrogram(msg.data.channel, msg.data.startBlockIndex, msg.data.blockSize, msg.data.settings)
                });
                break;
            }

            case WebviewMessageType.Error: {
                vscode.window.showErrorMessage(msg.data.message);
            }
        }
    }

    private postMessage(webview: vscode.Webview, message: ExtMessage) {
        webview.postMessage(message);
    }

    /**
     * Get the static HTML used for in our editor's webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this._context.extensionUri, 'dist', 'audioPreview.js'
        ));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this._context.extensionUri, 'dist', 'vscode.css'
        ));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this._context.extensionUri, 'dist', 'audioPreview.css'
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
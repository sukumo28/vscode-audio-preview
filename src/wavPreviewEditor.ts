import * as vscode from "vscode";
import { Disposable } from "./dispose";
import * as path from "path";
import { getNonce } from "./util";
import { WaveFile } from "wavefile";

interface SoundInfo {
    container: string;
    chunkSize: number;
    sampleRate: number;
    bitsPerSample: number;
    channelCount: number;
    framePerChannel: number;
    bitDepth: string;
    samples: number[][];
}

interface fmt {
    sampleRate: number;
    bitsPerSample: number;
    numChannels: number;
}

class WavPreviewDocument extends Disposable implements vscode.CustomDocument {
    
    static async create(
        uri: vscode.Uri,
        backupId: string | undefined,
    ): Promise<WavPreviewDocument | PromiseLike<WavPreviewDocument>> {
        // If we have a backup, read that. Otherwise read the resource from the workspace
        const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
        const fileData = await WavPreviewDocument.readFile(dataFile);
        const soundInfo = this.decode(fileData);
        return new WavPreviewDocument(uri, soundInfo);
    }

    private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        if (uri.scheme === 'untitled') {
            return new Uint8Array();
        }
        return vscode.workspace.fs.readFile(uri);
    }

    private static decode(fileData: Uint8Array) {
        const soundInfo: SoundInfo = {
            container: "", chunkSize: 0, sampleRate: 0, bitDepth: "",
            bitsPerSample: 0, channelCount:0, framePerChannel:0, samples: []
        };

        try {
            const waveFile = new WaveFile(fileData);
            soundInfo.container = waveFile.container;
            soundInfo.chunkSize = waveFile.chunkSize;
            soundInfo.bitDepth = waveFile.bitDepth;
            soundInfo.sampleRate = (waveFile.fmt as fmt).sampleRate;
            soundInfo.bitsPerSample = (waveFile.fmt as fmt).bitsPerSample;
            soundInfo.channelCount = (waveFile.fmt as fmt).numChannels;

            const samples = waveFile.getSamples();
            if (Array.isArray(samples)) {
                soundInfo.samples = (samples as Float64Array[]).map(x => Array.from(x));
            } else {
                soundInfo.samples = [ Array.from(samples) ];
            }
            soundInfo.framePerChannel = Math.max(...soundInfo.samples.map(x => x.length));

            if (soundInfo.bitDepth !== "32f" && soundInfo.bitDepth !== "64") {
                const hm = 2 << (soundInfo.bitsPerSample - 1);
                for (let ch = 0; ch < soundInfo.channelCount; ch++) {
                    const chData = soundInfo.samples[ch];
                    for(let i = 0; i < chData.length; i++) {
                        chData[i] = chData[i]<0? chData[i]/hm : chData[i]/(hm-1);
                    }
                }
            }
        } catch(err) {
            vscode.window.showErrorMessage(`Decoding failed due to ${err}`);
        }

        return soundInfo;
    }
    
    private readonly _uri: vscode.Uri;
    private _documentData: SoundInfo;

    private constructor(
        uri: vscode.Uri,
        initialContent: SoundInfo
    ) {
        super();
        this._uri = uri;
        this._documentData = initialContent;
    }

    public get uri() { return this._uri; }

    public get documentData(): SoundInfo { return this._documentData; }

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

export class WavPreviewEditorProvider implements vscode.CustomReadonlyEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            WavPreviewEditorProvider.viewType,
            new WavPreviewEditorProvider(context),
            {
                supportsMultipleEditorsPerDocument: false
            }
        );
    }

    private static readonly viewType = 'wavPreview.wavPreview';

    constructor(
		private readonly _context: vscode.ExtensionContext
	) { }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: { backupId?: string },
        _token: vscode.CancellationToken
    ): Promise<WavPreviewDocument> {
        const document: WavPreviewDocument = await WavPreviewDocument.create(
            uri,
            openContext.backupId
        );

        return document;
    }

    async resolveCustomEditor(
        document: WavPreviewDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        
        // Wait for the webview to be properly ready before we init
		webviewPanel.webview.onDidReceiveMessage(e => {
			if (e.type === 'ready') {
				webviewPanel.webview.postMessage({soundInfo: document.documentData});
			}
		});
    }

    /**
	 * Get the static HTML used for in our editor's webviews.
	 */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this._context.extensionPath, 'media', 'wavPreview.js')
        )); 
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this._context.extensionPath, 'media', 'vscode.css')
		));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this._context.extensionPath, 'media', 'wavPreview.css')
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
                <table id="info-table">
                    <tr>
                        <th>Key</th><th>Value</th>
                    </tr>
                </table>

                <button id="listen-button" disabled>please wait...</button>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
			</html>
        `;
    }
}

import * as vscode from "vscode";
import { Disposable } from "./dispose";
import * as path from "path";
import { getNonce } from "./util";
import { WaveFile } from 'wavefile';

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
        } catch(err) {
            vscode.window.showErrorMessage(err);
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

    private constructor(
        uri: vscode.Uri,
        initialContent: any
    ) {
        super();
        this._uri = uri;
        this._documentData = initialContent;
    }

    public get uri() { return this._uri; }

    public get wavHeader(): any { 
        return {
            fmt: this._documentData.fmt
        }; 
    }

    public get wavData(): any { 
        try {
            const sampleRate = this._documentData.fmt.sampleRate;
            const chNum = this._documentData.fmt.numChannels;
    
            // decompress
            switch(this._documentData.fmt.audioFormat) {
                case 6:
                    this._documentData.fromALaw();
                    break;
    
                case 7:
                    this._documentData.fromMuLaw();
                    break;
                
                case 17:
                    this._documentData.fromIMAADPCM();
                    break;
            }
    
            let samples = this._documentData.getSamples(false, Float32Array);
            if (chNum == 1) {
                samples = [samples];
            }
    
            // convert to [-1,1] float32
            if (this._documentData.fmt.audioFormat === 1) {
                const max = 1 << (this._documentData.fmt.bitsPerSample - 1);
                for (let ch=0; ch<chNum; ch++) {
                    for (let i=0; i<samples[ch].length; i++) {
                        const v = samples[ch][i];
                        samples[ch][i] = v < 0? v/max : v/(max-1);
                    }
                }
            }
            
            return {
                samples,
                sampleRate,
                numberOfChannels: chNum,
                length: samples[0].length,
                duration: samples[0].length / sampleRate
            }; 

        } catch(err) {
            vscode.window.showErrorMessage(err);
            return {
                samples: [[]],
                sampleRate: 0,
                numberOfChannels: 1,
                length: 0,
                duration: 0
            }; 
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

    constructor(
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

        return document;
    }

    async resolveCustomEditor(
        document: AudioPreviewDocument,
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
            switch (e.type) {
                case "ready":
                    webviewPanel.webview.postMessage({
                        type: "info",
                        data: document.wavHeader,
                        isTrusted: vscode.workspace.isTrusted
                    });
                    break;

                case "play":
                    webviewPanel.webview.postMessage({
                        type: "data",
                        data: document.wavData,
                        isTrusted: vscode.workspace.isTrusted
                    });
                    break;
            }
		});
    }

    /**
	 * Get the static HTML used for in our editor's webviews.
	 */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this._context.extensionPath, 'media', 'audioPreview.js')
        )); 
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this._context.extensionPath, 'media', 'vscode.css')
		));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.file(
			path.join(this._context.extensionPath, 'media', 'audioPreview.css')
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
                <div id="info-table"></div>

                <button id="listen-button" disabled>please wait...</button>
                <input type="range" id="seek-bar" value="0" />

                <div id="message"></div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
			</html>
        `;
    }
}

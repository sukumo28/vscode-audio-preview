import * as vscode from "vscode";
import { Disposable } from "./dispose";
import * as path from "path";
import { getNonce } from "./util";
const decode = require("audio-decode");

class AudioPreviewDocument extends Disposable implements vscode.CustomDocument {
    
    static async create(
        uri: vscode.Uri,
        backupId: string | undefined,
    ): Promise<AudioPreviewDocument | PromiseLike<AudioPreviewDocument>> {
        // If we have a backup, read that. Otherwise read the resource from the workspace
        const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
        const fileData = await AudioPreviewDocument.readFile(dataFile);
        try {
            const audioBuffer = await decode(fileData);
            return new AudioPreviewDocument(uri, audioBuffer);
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

    public get documentData(): any { return this._documentData; }

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
			if (e.type === 'ready') {
				webviewPanel.webview.postMessage({audioBuffer: document.documentData});
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
                <table id="info-table">
                    <tr>
                        <th>Key</th><th>Value</th>
                    </tr>
                </table>

                <button id="listen-button" disabled>please wait...</button>
                <input type="range" id="seek-bar" value="0" />

                <div id="message"></div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
			</html>
        `;
    }
}

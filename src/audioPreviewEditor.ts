import * as vscode from "vscode";
import { Disposable, disposeAll } from "./dispose";
import { getNonce } from "./util";
import { AnalyzeConfigDefault, Config } from "./config";
import { ExtData, ExtMessage, ExtMessageType, WebviewMessage, WebviewMessageType } from "./message";

class AudioPreviewDocument extends Disposable implements vscode.CustomDocument {

    static async create(
        uri: vscode.Uri,
        backupId: string | undefined
    ): Promise<AudioPreviewDocument | PromiseLike<AudioPreviewDocument>> {
        // If we have a backup, read that. Otherwise read the resource from the workspace
        const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
        const data = await AudioPreviewDocument.readFile(dataFile);
        return new AudioPreviewDocument(uri, data);
    }

    private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        if (uri.scheme === 'untitled') {
            return new Uint8Array();
        }
        return vscode.workspace.fs.readFile(uri);
    }

    private readonly _uri: vscode.Uri;
    private _documentData: Uint8Array;
    private _fsWatcher: vscode.FileSystemWatcher;

    private constructor (
        uri: vscode.Uri,
        initialContent: Uint8Array
    ) {
        super();
        this._uri = uri;
        this._documentData = initialContent;
        this._fsWatcher = vscode.workspace.createFileSystemWatcher(uri.fsPath, true, false, true);
        this.onDidChange = this._fsWatcher.onDidChange;
    }

    public get uri() { return this._uri; }

    public get documentData() { return this._documentData; }

    public onDidChange: vscode.Event<vscode.Uri>;

    public async reload() {
        this._documentData =await AudioPreviewDocument.readFile(this._uri);
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
            case WebviewMessageType.Config: {
                const config = vscode.workspace.getConfiguration("WavPreview");
                console.log(config);
                const autoPlay = config.get("autoPlay") as boolean;
                const autoAnalyze = config.get("autoAnalyze") as boolean;
                const analyzeConfigDefault = config.get("analyzeDefault") as AnalyzeConfigDefault;

                this.postMessage(webviewPanel.webview, {
                    type: ExtMessageType.Config,
                    data: { autoPlay, autoAnalyze, analyzeConfigDefault }
                });
                break;
            }

            case WebviewMessageType.Data: {
                if (!vscode.workspace.isTrusted) {
                    throw new Error("cannot play audio in untrusted workspace");
                }

                const dd = document.documentData;
                const a = Array.from(dd.slice(msg.data.start, msg.data.end));
                this.postMessage(webviewPanel.webview, {
                    type: ExtMessageType.Data,
                    data: {
                        samples: a, start: msg.data.start, end: msg.data.end, wholeLength: dd.length
                    }
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
                
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'unsafe-eval' 'nonce-${nonce}'; connect-src data:;">
                
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
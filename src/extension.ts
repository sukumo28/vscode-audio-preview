import * as vscode from 'vscode';
import { WavPreviewEditorProvider } from "./wavPreviewEditor";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(WavPreviewEditorProvider.register(context));
}

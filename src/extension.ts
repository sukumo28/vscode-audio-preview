import * as vscode from 'vscode';
import { AudioPreviewEditorProvider } from "./audioPreviewEditor";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(AudioPreviewEditorProvider.register(context));
}

import * as vscode from "vscode";
import { AudioPreviewEditorProvider } from "./audioPreviewEditor";

export function activate(context: vscode.ExtensionContext) {
  const extension = vscode.extensions.getExtension("sukumo28.wav-preview");
  console.log("version", extension?.packageJSON?.version);
  console.log("extension.extensionKind", extension?.extensionKind);
  console.log("vscode.env.uiKind", vscode.env.uiKind);
  console.log("vscode.env.remoteName", vscode.env.remoteName);
  context.subscriptions.push(AudioPreviewEditorProvider.register(context));
}

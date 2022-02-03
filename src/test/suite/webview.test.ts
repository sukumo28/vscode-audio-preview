import assert from "assert";
import path from "path";
import puppeteer from "puppeteer";
import { commands, Uri } from "vscode";

describe("webview", () => {
    before(async () => {
        global.browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9229',
            defaultViewport: null,
            slowMo: 400
        });
        global.page = (await global.browser.pages())[0];
    });

    describe("handle normal file", () => {
        before(async () => {
            // open normal wavfile
            const uri = Uri.file(path.join(__dirname, "..", "..", "..", "src", "test", "testdata", "sample.wav"));
            await commands.executeCommand("vscode.open", uri);

            // get CustomEditor dom content
            const editor = await global.page.waitForSelector("iframe.webview", { timeout: 10000 });
            const editorFrame = await editor.contentFrame();
            const editorContent = await editorFrame.waitForSelector("iframe#active-frame", { timeout: 10000 });
            const editorContentFrame = await editorContent.contentFrame();
            global.doc = editorContentFrame;
        });

        it("should have title 'Wav Preview'", async () => {
            const title = await global.doc.title();
            assert.strictEqual(title, "Wav Preview");
        });

        after(async () => {
            // close wavfile
        await commands.executeCommand("workbench.action.closeActiveEditor");
        });
    });

    after(async () => {
        await global.page.close();
        global.browser.disconnect();
    });
});

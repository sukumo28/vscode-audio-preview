import assert from "assert";
import path from "path";
import puppeteer from "puppeteer";
import vscode, { commands, Uri } from "vscode";
import { WaveFile } from "wavefile";

describe("webview", function() {
    before(async function() {
        // connect to VS Code
        global.browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9229',
            defaultViewport: null,
            slowMo: 10
        });

        // open dir :https://code.visualstudio.com/api/references/commands
        const uri = Uri.file(path.join(__dirname, "..", "..", "..", "src", "test", "testdata"));
        await commands.executeCommand("vscode.openFolder", uri, { 
            forceNewWindow: false, 
            noRecentEntry: false
        });

        // get page
        global.page = (await global.browser.pages())[0];
    });

    after(async function() {
        if (global.page) {
            await global.page.close();
        }
        if (global.browser) {
            // sync
            global.browser.disconnect();
        }
    });

    describe("handle normal file", function() {
        before(async function() {
            // open wavfile
            const uri = Uri.file(path.join(__dirname, "..", "..", "..", "src", "test", "testdata", "sample.wav"));
            await commands.executeCommand("vscode.open", uri);

            // get CustomEditor dom content
            const editor = await global.page.waitForSelector("iframe", { timeout: 3000 });
            const editorFrame = await editor.contentFrame();
            const editorContent = await editorFrame.waitForSelector("iframe#active-frame", { timeout: 3000 });
            const editorContentFrame = await editorContent.contentFrame();
            global.doc = editorContentFrame;
        });

        after(async function() {
            // close wavfile
            await commands.executeCommand("workbench.action.closeActiveEditor");
        });

        it("should have title 'Wav Preview'", async function() {
            const title = await global.doc.title();
            assert.strictEqual(title, "Wav Preview");
        });

        it("should show infomation about audio", async function() {
            const infoTable = await global.doc.waitForSelector("#info-table table", { timeout: 3000 });
            assert.strictEqual(!!infoTable, true);
        });

        it("should be wav whoes format is 1 (uncompressed PCM)", async function(){
            const elem = await global.doc.$("#info-table-format");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "1 (uncompressed PCM)");
        });

        it("should be wav whoes number_of_channel is 1", async function(){
            const elem = await global.doc.$("#info-table-number_of_channel");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "1 (mono)");
        });

        it("should be wav whoes sample_rate is 44100", async function(){
            const elem = await global.doc.$("#info-table-sample_rate");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "44100");
        });

        it("should be wav whoes bit_depth is 16", async function(){
            const elem = await global.doc.$("#info-table-bit_depth");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "16");
        });

        it("should be wav whoes file_size is 264640 byte", async function(){
            const elem = await global.doc.$("#info-table-file_size");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "264640 byte");
        });

        it("should be wav whoes duration is 3s", async function(){
            const elem = await global.doc.$("#info-table-duration");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "3s");
        });

        it("should have player after prepare message", async function() {
            const player = await global.doc.waitForSelector("#player", { timeout: 3000 });
            assert.strictEqual(!!player, true);
        });

        it("should count decode progress", async function() {
            const decodeState = await global.doc.$("#decode-state");
            const state = await (await decodeState.getProperty("textContent")).jsonValue();
            assert.match(state, /decode: \d{1,3}% done/);
        });

        it("should have play button after prepare message", async function() {
            const playButton = await global.doc.$("#listen-button");
            assert.strictEqual(!!playButton, true);
        });

        it("should start and stop playing when play button is clicked", async function() {
            const playButton = await global.doc.$("#listen-button");
            const text1 = await (await playButton.getProperty("textContent")).jsonValue();
            assert.strictEqual(text1, "play");
            await playButton.click();
            const text2 = await (await playButton.getProperty("textContent")).jsonValue();
            assert.strictEqual(text2, "stop");
            await playButton.click();
            const text3 = await (await playButton.getProperty("textContent")).jsonValue();
            assert.strictEqual(text3, "play");
        });

        it("should have volume bar after prepare message", async function() {
            const volumeBar = await global.doc.$("#volume-bar");
            assert.strictEqual(!!volumeBar, true);
        });

        it("should have seek bar after prepare message", async function() {
            const seekBar = await global.doc.$(".seek-bar-box");
            assert.strictEqual(!!seekBar, true);
        });

        it("should seek when seekbar's value is changed", async function() {
            const playButton = await global.doc.$("#listen-button");
            const text1 = await (await playButton.getProperty("textContent")).jsonValue();
            assert.strictEqual(text1, "play");

            const seekBar = await global.doc.$("#user-input-seek-bar");
            await seekBar.evaluate((node) => {
                node.value = "30";
                node.dispatchEvent(new Event("change"));
            });

            const text2 = await (await playButton.getProperty("textContent")).jsonValue();
            assert.strictEqual(text2, "stop");

            await global.page.waitForTimeout(50);
            const value = await (await seekBar.getProperty("value")).jsonValue();
            assert.strictEqual(Number(value) > 30, true);

            await playButton.click();
        });

        it("should stop playing when finish playing", async function() {
            const seekBar = await global.doc.$("#user-input-seek-bar");
            await seekBar.evaluate((node) => {
                node.value = "90";
                node.dispatchEvent(new Event("change"));
            });

            const playButton = await global.doc.$("#listen-button");
            const text1 = await (await playButton.getProperty("textContent")).jsonValue();
            assert.strictEqual(text1, "stop");

            await global.page.waitForTimeout(300);
            const value = await (await seekBar.getProperty("value")).jsonValue();
            assert.strictEqual(Number(value), 100);

            const text2 = await (await playButton.getProperty("textContent")).jsonValue();
            assert.strictEqual(text2, "play");
        });

        it("should have analyzer after finish decoding", async function() {
            const analyzer = await global.doc.waitForSelector("#analyzer", { timeout: 3000 });
            assert.strictEqual(!!analyzer, true);
        });

        it("should have analyze button", async function() {
            const analyzeButton = await global.doc.$("#analyze-button");
            assert.strictEqual(!!analyzeButton, true);
        });

        // analyze result is tested in other test
        it("should analyze when analyze button is clicked", async function() {
            await global.doc.click("#analyze-button");
            const resultBox = await global.doc.waitForSelector("#analyze-result-box", { timeout: 3000 });
            assert.strictEqual(!!resultBox, true);
        });
    });

    describe("handle broken file", function() {
        before(async function() {
            // open wavfile: https://code.visualstudio.com/api/references/commands
            const uri = Uri.file(path.join(__dirname, "..", "..", "..", "src", "test", "testdata", "broken.wav"));
            await commands.executeCommand("vscode.open", uri);

            // get CustomEditor dom content
            const editor = await global.page.waitForSelector("iframe", { timeout: 3000 });
            const editorFrame = await editor.contentFrame();
            const editorContent = await editorFrame.waitForSelector("iframe#active-frame", { timeout: 3000 });
            const editorContentFrame = await editorContent.contentFrame();
            global.doc = editorContentFrame;
        });

        after(async function() {
            // close wavfile
            await commands.executeCommand("workbench.action.closeActiveEditor");
        });

        it("should show infomation about audio", async function() {
            const infoTable = await global.doc.waitForSelector("#info-table table", { timeout: 3000 });
            assert.strictEqual(!!infoTable, true);
        });

        it("should be wav whoes format is undefined (unsupported)", async function(){
            const elem = await global.doc.$("#info-table-format");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "undefined (unsupported)");
        });

        it("should be wav whoes number_of_channel is undefined (unsupported)", async function(){
            const elem = await global.doc.$("#info-table-number_of_channel");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "undefined (unsupported)");
        });

        it("should be wav whoes sample_rate is undefined", async function(){
            const elem = await global.doc.$("#info-table-sample_rate");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "undefined");
        });

        it("should be wav whoes bit_depth is undefined", async function(){
            const elem = await global.doc.$("#info-table-bit_depth");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "undefined");
        });

        it("should be wav whoes file_size is NaN byte", async function(){
            const elem = await global.doc.$("#info-table-file_size");
            const value = await (await elem.getProperty("textContent")).jsonValue();
            assert.strictEqual(value, "NaN byte");
        });

        it("should not show duration", async function(){
            const elem = await global.doc.$("#info-table-duration");
            assert.strictEqual(elem, null);
        });

        it("should not have play button", async function() {
            const b = await global.doc.$("#listen-button");
            assert.strictEqual(b, null);
        });

        it("should not have analyze button", async function() {
            const b = await global.doc.$("#analyze-button");
            assert.strictEqual(b, null);
        });
    });

    describe("handle updating wavfile", function() {
        before(async function() {
            // generate wavfile (in /out/test/suit.  not in testdata)
            const uri = Uri.file(path.join(__dirname, "..", "..", "..", "src", "test", "testdata", "update.wav"));
            global.updateWavUri = uri;
            const wav = new WaveFile();
            wav.fromScratch(1, 44100, "16", new Int16Array(10));
            await vscode.workspace.fs.writeFile(uri, wav.toBuffer());

            // open wavfile: https://code.visualstudio.com/api/references/commands
            await commands.executeCommand("vscode.open", uri);

            // get CustomEditor dom content
            const editor = await global.page.waitForSelector("iframe", { timeout: 3000 });
            const editorFrame = await editor.contentFrame();
            const editorContent = await editorFrame.waitForSelector("iframe#active-frame", { timeout: 3000 });
            const editorContentFrame = await editorContent.contentFrame();
            global.doc = editorContentFrame;
        });

        after(async function() {
            // close wavfile
            await commands.executeCommand("workbench.action.closeActiveEditor");
            // delete wavfile
            const uri = global.updateWavUri;
            await vscode.workspace.fs.delete(uri);
        });

        it("should be wav whoes sample_rate is 44100", async function() {
            await global.doc.waitForSelector("#info-table table", { timeout: 3000 });
            const sampleRateElem = await global.doc.$("#info-table-sample_rate");
            const sampleRate = await (await sampleRateElem.getProperty("textContent")).jsonValue();
            assert.strictEqual(sampleRate, "44100");
        });

        it("should be reloaded when wavfile is updated", async function() {
            // update wav
            const uri = global.updateWavUri;
            const wav = new WaveFile();
            wav.fromScratch(1, 48000, "16", new Int16Array(10));
            await vscode.workspace.fs.writeFile(uri, wav.toBuffer());

            // check if it is reloaded
            await global.page.waitForTimeout(1000);
            const sampleRateElem = await global.doc.$("#info-table-sample_rate");
            const sampleRate = await (await sampleRateElem.getProperty("textContent")).jsonValue();
            assert.strictEqual(sampleRate, "48000");
        });
    });

});

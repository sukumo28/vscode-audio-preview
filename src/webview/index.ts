import Player from "./player";
import InfoTable from "./infoTable";
import Analyzer from "./analyzer";

interface vscode {
    postMessage(message: any): void;
}

declare function acquireVsCodeApi(): vscode;

(function () {
    const vscode = acquireVsCodeApi();
    let audioBuffer: AudioBuffer, player: Player, infoTable: InfoTable, analyzer: Analyzer;

    // Handle messages from the extension
    window.addEventListener('message', async e => {
        const { type, data, isTrusted } = e.data;

        switch (type) {
            case "info":
                infoTable = new InfoTable();
                if (!data) {
                    infoTable.showErrorMessage("failed to decode header");
                    break;
                }
                infoTable.showInfo(data);
                // do not play audio in untrusted workspace 
                if (isTrusted === false) {
                    infoTable.showErrorMessage("Cannot play audio in untrusted workspaces");
                    break;
                }
                vscode.postMessage({ type: 'prepare' });
                break;

            case "prepare":
                if (!data) {
                    infoTable.showErrorMessage("failed to decode data");
                    break;
                }
                prepare(data);
                vscode.postMessage({ type: 'data', start: 0, end: 10000 });
                break;

            case "data":
                if (!data) {
                    infoTable.showErrorMessage("failed to decode data: invalid");
                    break;
                }
                setData(data);

                if (data.autoPlay && player) {
                    player.button.click();
                }

                if (data.isEnd) {
                    analyzer.enable(data.autoAnalyze);
                    break;
                }

                vscode.postMessage({ type: 'data', start: data.end, end: data.end + 10000 });
                break;

            case "reload":
                reload();
                vscode.postMessage({ type: 'ready' });
                break;

            case "spectrogram":
                if (!data) {
                    infoTable.showErrorMessage("failed to draw spectrogram");
                    break;
                }
                if (data.settings.analyzeID !== analyzer.latestAnalyzeID) break; // cancel old analyze
                analyzer.drawSpectrogram(data);
                const endIndex = Math.round(data.settings.maxTime * audioBuffer.sampleRate);
                if (endIndex < data.end) break;
                vscode.postMessage({ type: "spectrogram", channel: data.channel, start: data.end, end: data.end + 10000, settings: data.settings });
                break;
        }
    });

    function prepare(data) {
        try {
            const ac = new AudioContext({ sampleRate: data.sampleRate });
            audioBuffer = ac.createBuffer(data.numberOfChannels, data.length, data.sampleRate);
            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const f32a = new Float32Array(audioBuffer.length);
                audioBuffer.copyToChannel(f32a, ch);
            }

            // set player ui
            player = new Player(ac, audioBuffer, data.duration);
            const userinputSeekbar = document.getElementById("user-input-seek-bar");
            const visibleSeekbar = <HTMLInputElement>document.getElementById("seek-bar");
            player.registerSeekbar("main-seekbar", userinputSeekbar, (value) => { visibleSeekbar.value = value; }, undefined);

            // insert additional data to infoTable
            infoTable.insertTableData(["duration", data.duration + "s"]);

            // init analyzer
            analyzer = new Analyzer(
                audioBuffer,
                (name, inputbar, updateCallback, valueConvertFunc) => {
                    player.removeSeekbar(name);
                    player.registerSeekbar(name, inputbar, updateCallback, valueConvertFunc);
                },
                (msg) => {
                    vscode.postMessage(msg);
                }
            );
            analyzer.clearAnalyzeResult();

        } catch (err) {
            infoTable.showErrorMessage("failed to prepare: " + err);
            document.getElementById("listen-button").style.display = "none";
            return;
        }
    }

    function setData(data) {
        // copy passed data.samples into audioBuffer manually, because it is once stringified, 
        // and its children are not recognised as Float32Array
        for (let ch = 0; ch < data.numberOfChannels; ch++) {
            const f32a = new Float32Array(data.length);
            for (let i = 0; i < f32a.length; i++) {
                f32a[i] = data.samples[ch][i];
            }
            audioBuffer.copyToChannel(f32a, ch, data.start);
        }

        // show progress
        const progress = Math.min(Math.floor(data.end * 100 / audioBuffer.length), 100);
        infoTable.updateDecdeState("decode: " + progress + "% done");
    }

    function reload() {
        if (player) {
            player.dispose();
            player = undefined;
        }
        infoTable = undefined;
        analyzer = undefined;
    }

    // Signal to VS Code that the webview is initialized.
    vscode.postMessage({ type: 'ready' });
}());
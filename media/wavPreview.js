(function () {
    const vscode = acquireVsCodeApi();

    const infoTable = document.getElementById("info-table");
    const listenButton = document.getElementById("listen-button");

    // Handle messages from the extension
    window.addEventListener('message', async e => {
        const { soundInfo } = e.data;

        //insert datas to info table
        infoTable.innerHTML +=
            `<tr><td>container</td><td>${soundInfo.container}</td></tr>\n` +
            `<tr><td>size(byte)</td><td>${soundInfo.chunkSize + 8}</td></tr>\n` +
            `<tr><td>sample rate</td><td>${soundInfo.sampleRate}</td></tr>\n` +
            `<tr><td>bitDepth</td><td>${soundInfo.bitDepth}</td></tr>\n` +
            `<tr><td>channel count</td><td>${soundInfo.channelCount}</td></tr>\n`
        ;

        //copy data to audioBuffer
        const ac = new AudioContext();
        const myBuffer = ac.createBuffer(soundInfo.channelCount, soundInfo.framePerChannel, soundInfo.sampleRate);
        for (let ch = 0; ch < soundInfo.channelCount; ch++) {
            myBuffer.copyToChannel(Float32Array.from(soundInfo.samples[ch]), ch);
        }
        //set onclick event to play sound
        listenButton.onclick = function () {
            const source = ac.createBufferSource();
            source.buffer = myBuffer;
            source.connect(ac.destination);
            source.start();
        };
        //enable play button
        listenButton.textContent = "Play";
        listenButton.disabled = false;
    });

    // Signal to VS Code that the webview is initialized.
    vscode.postMessage({ type: 'ready' });
}());
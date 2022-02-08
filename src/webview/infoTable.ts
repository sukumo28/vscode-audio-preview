import { Disposable } from "../dispose";
import { ExtInfoData, ExtMessage, ExtPrepareData } from "../message";
import { EventType, Event } from "./events";

export default class InfoTable extends Disposable {
    infoTable: HTMLTableElement;

    constructor (parentID: string) {
        super();
        const parent = document.getElementById(parentID);
        this.infoTable = document.createElement("table");
        parent.appendChild(this.infoTable);

        this._register(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => {
            const { type, data } = e.data;
            if (type !== "prepare") return;
            const extData = data as ExtPrepareData;
            // insert additional data to infoTable
            this.insertTableData(["duration", extData.duration + "s"]);
        }));
    }

    showInfo(data: ExtInfoData) {
        const compressFormat = {
            0: "unknown", 1: "uncompressed PCM", 2: "Microsoft ADPCM",
            3: "IEEE Float", 6: "a-law", 7: "mu-law",
            17: "IMA ADPCM", 20: "ITU G.723 ADPCM (Yamaha)", 49: "GSM 6.10",
            64: "ITU G.721 ADPCM", 80: "MPEG",
            65535: "Experimental"
        }[data.audioFormat] || "unsupported";

        const channels = {
            1: "mono", 2: "stereo"
        }[data.numChannels] || "unsupported";

        const info = [
            { name: "format", value: `${data.audioFormat} (${compressFormat})` },
            { name: "number of channel", value: `${data.numChannels} (${channels})` },
            { name: "sampleRate", value: `${data.sampleRate}` },
            { name: "bitsPerSample (bit depth)", value: `${data.bitsPerSample}` },
            { name: "fileSize", value: `${data.chunkSize + 8} byte` },
        ];

        // clear info table
        const trList = this.infoTable.querySelectorAll("tr");
        trList.forEach(tr => {
            this.infoTable.removeChild(tr);
        })
        // insert datas to info table
        for (const i of info) {
            this.insertTableData([i.name, i.value]);
        }
    }

    insertTableData(values: string[]) {
        const tr = document.createElement("tr");
        for (const v of values) {
            const td = document.createElement("td");
            td.textContent = v;
            tr.appendChild(td);
        }
        this.infoTable.appendChild(tr);
    }
}
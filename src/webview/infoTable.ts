import { Disposable } from "../dispose";
import { ExtInfoData, ExtMessage, ExtMessageType } from "../message";
import { EventType, Event } from "./events";

export default class InfoTable extends Disposable {
    private infoTable: HTMLTableElement;

    constructor (parentID: string) {
        super();
        const parent = document.getElementById(parentID);
        this.infoTable = document.createElement("table");
        parent.appendChild(this.infoTable);

        this._register(new Event(window, EventType.VSCodeMessage, (e: MessageEvent<ExtMessage>) => this.onReceiveMessage(e.data)));
    }

    private onReceiveMessage(msg: ExtMessage) {
        if (!msg || msg.type !== ExtMessageType.Prepare) return;
        if (!msg.data) return;
        // insert additional data to infoTable
        this.insertTableData("duration", msg.data.duration + "s");
    }

    public showInfo(data: ExtInfoData) {
        if (!data) return;

        const channels = {
            1: "mono", 2: "stereo"
        }[data.numChannels] || "unsupported";

        const info = [
            { name: "encoding", value: `${data.encoding}` },
            { name: "format", value: `${data.format}` },
            { name: "number_of_channel", value: `${data.numChannels} (${channels})` },
            { name: "sample_rate", value: `${data.sampleRate}` },
            { name: "file_size", value: `${data.fileSize} byte` },
        ];

        // clear info table
        const trList = this.infoTable.querySelectorAll("tr");
        trList.forEach(tr => {
            this.infoTable.removeChild(tr);
        })
        // insert datas to info table
        for (const i of info) {
            this.insertTableData(i.name, i.value);
        }
    }

    private insertTableData(name: string, value: string) {
        const tr = document.createElement("tr");
        const nameTd = document.createElement("td");
        nameTd.textContent = name;
        tr.appendChild(nameTd);
        const valueTd = document.createElement("td");
        valueTd.textContent = value;
        valueTd.id = `info-table-${name}`;
        tr.appendChild(valueTd);
        this.infoTable.appendChild(tr);
    }
}
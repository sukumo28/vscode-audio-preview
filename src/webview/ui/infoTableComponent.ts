export default class InfoTableComponent {
    private _infoTable: HTMLTableElement;

    constructor (parentID: string) {
        const parent = document.getElementById(parentID);
        this._infoTable = document.createElement("table");
        parent.appendChild(this._infoTable);
    }

    public showInfo(numChannels: number, sampleRate: number, fileSize: number, format: string, encoding: string) {
        const channels = {
            1: "mono", 2: "stereo"
        }[numChannels] || "unsupported";

        const info = [
            { name: "encoding", value: `${encoding}` },
            { name: "format", value: `${format}` },
            { name: "number_of_channel", value: `${numChannels} (${channels})` },
            { name: "sample_rate", value: `${sampleRate}` },
            { name: "file_size", value: `${fileSize} byte` },
        ];

        // clear info table
        const trList = this._infoTable.querySelectorAll("tr");
        trList.forEach(tr => {
            this._infoTable.removeChild(tr);
        })
        // insert datas to info table
        for (const i of info) {
            this.insertTableData(i.name, i.value);
        }
    }

    public showAdditionalInfo(duration: number) {
        this.insertTableData("duration", duration + "s");
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
        this._infoTable.appendChild(tr);
    }
}
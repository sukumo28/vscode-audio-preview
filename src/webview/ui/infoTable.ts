export default class InfoTable {
    constructor (parentID: string, numChannels: number, encoding: string, format: string, sampleRate: number, fileSize: number) {
        const parent = document.getElementById(parentID);
        const infoTable = document.createElement("table");
        parent.appendChild(infoTable);

        // insert data into table
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
        const trList = infoTable.querySelectorAll("tr");
        trList.forEach(tr => {
            infoTable.removeChild(tr);
        })
        // insert datas to info table
        for (const i of info) {
            this.insertTableData(infoTable, i.name, i.value);
        }
    }

    private insertTableData(infoTable: HTMLTableElement, name: string, value: string) {
        const tr = document.createElement("tr");
        const nameTd = document.createElement("td");
        nameTd.textContent = name;
        tr.appendChild(nameTd);
        const valueTd = document.createElement("td");
        valueTd.textContent = value;
        valueTd.id = `info-table-${name}`;
        tr.appendChild(valueTd);
        infoTable.appendChild(tr);
    }
}
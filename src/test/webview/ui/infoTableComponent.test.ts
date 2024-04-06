import InfoTableComponent from "../../../webview/ui/infoTableComponent";

describe('infoTable', () => {

    let infoTableComponent: InfoTableComponent;
    beforeAll(() => {
        document.body.innerHTML = '<div id="info-table"></div>';
        infoTableComponent = new InfoTableComponent("info-table");
    });

    test('show encoding', () => {
        infoTableComponent.showInfo(2, 44100, 1, "s16", "pcm_s16le");
        expect(document.getElementById('info-table-encoding')?.textContent).toBe('pcm_s16le');
    });

    test('show format', () => {
        infoTableComponent.showInfo(2, 44100, 1, "s16", "pcm_s16le");
        expect(document.getElementById('info-table-format')?.textContent).toBe('s16');
    });

    test('show number of channel (mono)', () => {
        infoTableComponent.showInfo(1, 44100, 1, "s16", "pcm_s16le");
        expect(document.getElementById('info-table-number_of_channel')?.textContent).toBe('1 ch (mono)');
    });

    test('show number of channel (stereo)', () => {
        infoTableComponent.showInfo(2, 44100, 1, "s16", "pcm_s16le");
        expect(document.getElementById('info-table-number_of_channel')?.textContent).toBe('2 ch (stereo)');
    });

    test('show sample rate', () => {
        infoTableComponent.showInfo(2, 44100, 1, "s16", "pcm_s16le");
        expect(document.getElementById('info-table-sample_rate')?.textContent).toBe('44,100 Hz');
    });

    test('show file size', () => {
        infoTableComponent.showInfo(2, 44100, 1, "s16", "pcm_s16le");
        expect(document.getElementById('info-table-file_size')?.textContent).toBe('1 bytes');
    });

    test('show duration', () => {
        infoTableComponent.showAdditionalInfo(12.34);
        expect(document.getElementById('info-table-duration')?.textContent).toBe('12.3 s');
    });
});
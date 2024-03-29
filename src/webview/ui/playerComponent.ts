import { Disposable } from '../../dispose';
import { Event, EventType } from '../events';
import PlayerService from '../service/playerService';

export default class PlayerComponent extends Disposable {
    private _playButton: HTMLButtonElement;
    private _volumeBar: HTMLInputElement;
    private _playerService: PlayerService;

    constructor(parentID: string, playerService: PlayerService) {
        super();
        this._playerService = playerService;
        this._register(this._playerService);
        
        // init base html
        const parent = document.getElementById(parentID);
        parent.innerHTML = `
            <button id="play-button">play</button>

            <div>volume</div>
            <input type="range" id="volume-bar" value="100">
                        
            <div>seekbar</div>
            <div class="seek-bar-box">
                <input type="range" id="seek-bar" value="0" />
                <input type="range" id="user-input-seek-bar" class="input-seek-bar" value="0" />
            </div>
        `;

        // init main seekbar event
        // To avoid inconvenience when the timing of user input overlaps with the change in value over time,
        // we separate the InputElement for display and the InputElement that actually accepts user input.
        const userinputSeekbar = <HTMLInputElement>document.getElementById("user-input-seek-bar");
        this._register(new Event(userinputSeekbar, EventType.Change, () => {
            this._playerService.onSeekbarInput(Number(userinputSeekbar.value));
            // We reset the value of the input element for user input to 100 each time,
            // because it does not respond when the user inputs exactly the same value as the previous one.
            // Since 100 is the value at the end of playback, there is no problem if it does not respond.
            userinputSeekbar.value = "100";
        }));
        const visibleSeekbar = <HTMLInputElement>document.getElementById("seek-bar");
        this._register(new Event(window, EventType.UpdateSeekbar, (e: CustomEventInit) => {
            visibleSeekbar.value = e.detail.value;
        }));

        // init volumebar
        this._volumeBar = <HTMLInputElement>document.getElementById("volume-bar");
        this._register(new Event(this._volumeBar, EventType.Change, () => {
            // convert seekbar value(0~100) to volume(0~1)
            this._playerService.volume = Number(this._volumeBar.value) / 100;
        }));

        // init play button
        this._playButton = <HTMLButtonElement>document.getElementById("play-button");
        this._register(new Event(this._playButton, EventType.Click, () => {
            if (this._playerService.isPlaying) {
                this._playerService.pause();
            } else {
                this._playerService.play();
            }
        }));
        this._playButton.textContent = "play";
        this._playButton.style.display = "block";
        this._register(new Event(window, EventType.UpdateIsPlaying, () => {
            if (this._playerService.isPlaying) {
                this._playButton.textContent = "pause";
            } else {
                this._playButton.textContent = "play";
            }
        }));

        // register keyboard shortcuts
        // don't use command.register at audioPreviewEditorProvider.openCustomDocument due to command confliction
        this._register(new Event(window, EventType.KeyDown, (e: KeyboardEvent) => {
            if (e.isComposing || e.code !== "Space") {
                return;
            }
            e.preventDefault();
            this._playButton.click();
        }));
    }

    public dispose() {
        if (this._playerService.isPlaying) this._playerService.pause();
        super.dispose();
    }

}
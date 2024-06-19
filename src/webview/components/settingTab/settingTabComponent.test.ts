import {
  createAudioContext,
  MockAudioBuffer,
  postMessageFromWebview,
} from "../../../__mocks__/helper";
import { AnalyzeDefault, PlayerDefault } from "../../../config";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";
import PlayerService from "../../services/playerService";
import PlayerSettingsService from "../../services/playerSettingsService";
import SettingTab from "./settingTabComponent";

describe("settingTabComponent", () => {
  let playerService: PlayerService;
  let playerSettingService: PlayerSettingsService;
  let analyzeService: AnalyzeService;
  let analyzeSettingsService: AnalyzeSettingsService;
  let settingTabComponent: SettingTab;
  beforeAll(() => {
    document.body.innerHTML = '<div id="settingTab"></div>';
    const audioContext = createAudioContext(44100);
    const audioBuffer = new MockAudioBuffer(
      44100,
      1,
      44100,
    ) as unknown as AudioBuffer;
    analyzeService = new AnalyzeService(audioBuffer);
    const analyzeDefault = {} as AnalyzeDefault;
    analyzeSettingsService = AnalyzeSettingsService.fromDefaultSetting(
      analyzeDefault,
      audioBuffer,
    );
    const playerDefault = {} as PlayerDefault;
    playerSettingService = PlayerSettingsService.fromDefaultSetting(
      playerDefault,
      audioBuffer,
    );
    playerService = new PlayerService(
      audioContext,
      audioBuffer,
      playerSettingService,
    );
    settingTabComponent = new SettingTab(
      "#settingTab",
      playerService,
      playerSettingService,
      analyzeService,
      analyzeSettingsService,
      audioBuffer,
      postMessageFromWebview,
    );
  });

  afterAll(() => {
    analyzeService.dispose();
    analyzeSettingsService.dispose();
    settingTabComponent.dispose();
  });

  test("contents of tab is hide by default", () => {
    const contents = document.querySelector(".settingTab__content").children;
    for (const content of contents) {
      expect((content as HTMLElement).style.display).toBe("none");
    }
  });

  test("click player-button should show player content", () => {
    const playerButton = document.querySelector(
      ".js-settingTabButton-player",
    ) as HTMLButtonElement;
    playerButton.click();
    const playerContent = document.querySelector(
      ".js-settingTabContent-player",
    ) as HTMLElement;
    expect(playerContent.style.display).toBe("block");
  });

  test("click analyze-button should show analyze content", () => {
    const analyzeButton = document.querySelector(
      ".js-settingTabButton-analyze",
    ) as HTMLButtonElement;
    analyzeButton.click();
    const analyzeContent = document.querySelector(
      ".js-settingTabContent-analyze",
    ) as HTMLElement;
    expect(analyzeContent.style.display).toBe("block");
  });

  test("click hide-button should hide all contents", () => {
    const hideButton = document.querySelector(
      ".js-settingTabButton-hide",
    ) as HTMLButtonElement;
    hideButton.click();
    const contents = document.querySelector(".settingTab__content").children;
    for (const content of contents) {
      expect((content as HTMLElement).style.display).toBe("none");
    }
  });

  test("selected tab button should have active class", () => {
    const analyzeButton = document.querySelector(
      ".js-settingTabButton-analyze",
    ) as HTMLButtonElement;
    analyzeButton.click();
    expect(analyzeButton.classList.contains("settingTab__button--active")).toBe(
      true,
    );
    const hideButton = document.querySelector(
      ".js-settingTabButton-hide",
    ) as HTMLButtonElement;
    hideButton.click();
    expect(hideButton.classList.contains("settingTab__button--active")).toBe(
      true,
    );
  });

  test("active class should be removed when other tab button is clicked", () => {
    const analyzeButton = document.querySelector(
      ".js-settingTabButton-analyze",
    ) as HTMLButtonElement;
    analyzeButton.click();
    const hideButton = document.querySelector(
      ".js-settingTabButton-hide",
    ) as HTMLButtonElement;
    hideButton.click();
    expect(analyzeButton.classList.contains("settingTab__button--active")).toBe(
      false,
    );
  });
});

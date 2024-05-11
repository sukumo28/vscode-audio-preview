import "./settingTabComponent.css";
import Component from "../../component";
import { EventType } from "../../events";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";
import AnalyzeSettingsComponent from "../analyzeSettings/analyzeSettingsComponent";
import EasyCutComponent from "../easyCut/easyCutComponent";
import { PostMessage } from "../../../message";

export default class SettingTab extends Component {
  private _componentRoot: HTMLElement;

  constructor(
    coponentRootSelector: string,
    analyzeService: AnalyzeService,
    analyzeSettingsService: AnalyzeSettingsService,
    audioBuffer: AudioBuffer,
    postMessage: PostMessage,
  ) {
    super();

    this._componentRoot = document.querySelector(coponentRootSelector);

    this._componentRoot.innerHTML = `
      <div class="settingTab">
        <div class="settingTab__menu">
          <div>Setting</div>
          <button class="settingTab__button settingTab__button--active js-settingTabButton-hide">hide</button>
          <button class="settingTab__button js-settingTabButton-analyze">analyze</button>
          <button class="settingTab__button js-settingTabButton-easyCut">easyCut</button>
        </div>
        <div class="settingTab__content">
          <div class="js-settingTabContent-analyze"></div>
          <div class="js-settingTabContent-easyCut"></div>
        </div>
      </div>
    `;

    // hide is default
    this.hideAllContent();

    // create tab content
    new AnalyzeSettingsComponent(
      `${coponentRootSelector} .js-settingTabContent-analyze`,
      analyzeService,
      analyzeSettingsService,
    );
    new EasyCutComponent(
      `${coponentRootSelector} .js-settingTabContent-easyCut`,
      audioBuffer,
      analyzeSettingsService,
      postMessage,
    );

    // hide tab event
    const hideTabButton = this._componentRoot.querySelector(
      ".js-settingTabButton-hide",
    ) as HTMLButtonElement;
    this._addEventlistener(hideTabButton, EventType.CLICK, () => {
      this.hideAllContent();
      this.resetActivebutton();
      hideTabButton.classList.add("settingTab__button--active");
    });

    // analyze tab event
    const analyzeTabButton = this._componentRoot.querySelector(
      ".js-settingTabButton-analyze",
    ) as HTMLButtonElement;
    this._addEventlistener(analyzeTabButton, EventType.CLICK, () => {
      this.hideAllContent();
      this.resetActivebutton();
      const analyzeTabContent = this._componentRoot.querySelector(
        ".js-settingTabContent-analyze",
      ) as HTMLElement;
      analyzeTabContent.style.display = "block";
      analyzeTabButton.classList.add("settingTab__button--active");
    });

    // easyCut tab event
    const easyCutTabButton = this._componentRoot.querySelector(
      ".js-settingTabButton-easyCut",
    ) as HTMLButtonElement;
    this._addEventlistener(easyCutTabButton, EventType.CLICK, () => {
      this.hideAllContent();
      this.resetActivebutton();
      const easyCutTabContent = this._componentRoot.querySelector(
        ".js-settingTabContent-easyCut",
      ) as HTMLElement;
      easyCutTabContent.style.display = "block";
      easyCutTabButton.classList.add("settingTab__button--active");
    });
  }

  private resetActivebutton() {
    const activeButton = this._componentRoot.querySelector(
      ".settingTab__button--active",
    ) as HTMLButtonElement;
    activeButton.classList.remove("settingTab__button--active");
  }

  private hideAllContent() {
    const content = this._componentRoot.querySelector(
      ".settingTab__content",
    ) as HTMLElement;
    for (const c of content.children) {
      (c as HTMLElement).style.display = "none";
    }
  }
}

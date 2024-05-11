import "./settingTabComponent.css";
import Component from "../../component";
import { EventType } from "../../events";
import AnalyzeService from "../../services/analyzeService";
import AnalyzeSettingsService from "../../services/analyzeSettingsService";
import AnalyzeSettingsComponent from "../analyzeSettings/analyzeSettingsComponent";

export default class SettingTab extends Component {
  private _componentRoot: HTMLElement;

  constructor(
    coponentRootSelector: string,
    analyzeService: AnalyzeService,
    analyzeSettingsService: AnalyzeSettingsService,
  ) {
    super();

    this._componentRoot = document.querySelector(coponentRootSelector);

    this._componentRoot.innerHTML = `
      <div class="settingTab">
        <div class="settingTab__menu">
          <div>Setting</div>
          <button class="settingTab__button settingTab__button--active js-settingTabButton-hide">hide</button>
          <button class="settingTab__button js-settingTabButton-analyze">analyze</button>
        </div>
        <div class="settingTab__content">
          <div class="js-settingTabContent-analyze">analyze</div>
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

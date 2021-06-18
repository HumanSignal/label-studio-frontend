/* global inject, locate */
const { I } = inject();

module.exports = {
  GENERAL_SETTINGS: {
    SHOW_LABELS: "Show labels inside the regions",
    AUTO_SELECT_REGION: "Select regions after creating"
  },
  _openButtonLocator: locate('button[aria-label="Settings"]'),
  _closeButtonLocator: locate('button[aria-label="Close"]'),
  _modalLocator: locate(".ant-modal"),
  open() {
    I.click(this._openButtonLocator);
    I.seeElement(this._modalLocator);
  },
  close() {
    I.click(this._closeButtonLocator);
    I.waitToHide(this._modalLocator);
  },
  setGeneralSettings(settings = {}) {
    for (let [setting, value] of Object.entries(settings)) {
      if (value) {
        I.dontSeeCheckboxIsChecked(setting);
        I.checkOption(setting);
        I.seeCheckboxIsChecked(setting);
      } else {
        I.seeCheckboxIsChecked(setting);
        I.checkOption(setting);
        I.dontSeeCheckboxIsChecked(setting);
      }
    }
  },
};

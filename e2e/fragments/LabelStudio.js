const { I } = inject();
const Helpers = require('../tests/helpers');
const Asserts = require('../utils/asserts');

module.exports = {
  init({ events = {}, ...params }) {
    I.executeScript(Helpers.createLabelStudioInitFunction(params));
    for (const [eventName, callback] of Object.entries(events)) {
      I.on(eventName, callback);
    }
  },
  on(eventName, callback) {
    I.executeScript(Helpers.createAddEventListenerScript(eventName, callback));
  },
  async serialize() {
    const result = await I.executeScript(Helpers.serialize);

    return result;
  },

  hasFF(fflag) {
    return I.executeScript(Helpers.hasFF, fflag);
  },

  setFeatureFlagsDefaultValue(value) {
    I.executeScript(Helpers.setFeatureFlagsDefaultValue, value);
  },

  setFeatureFlags(featureFlags) {
    I.executeScript(Helpers.setFeatureFlags, featureFlags);
  },

  clearModalIfPresent() {
    I.executeScript(Helpers.clearModalIfPresent);
  },

  waitForObjectsReady() {
    I.executeScript(Helpers.waitForObjectsReady);
  },

  async resultsNotChanged(result, fractionDigits = 2) {
    const serialized = (await this.serialize());

    Asserts.deepEqualWithTolerance(result, serialized, fractionDigits);
  },

  async resultsChanged(result, fractionDigits = 2) {
    const serialized = (await this.serialize());

    Asserts.notDeepEqualWithTolerance(result, serialized, fractionDigits);
  },

  async grabUserLabels() {
    const userLabels = await I.executeScript(() => {
      return Object.fromEntries(Object.entries(window.Htx.userLabels?.controls).map(([control, labels]) => {
        return [control, labels.map(label => label.path)];
      }));
    });

    return userLabels;
  },

  initUserLabels(userLabels) {
    return I.executeScript((userLabels) => {
      window.Htx.userLabels?.init(userLabels);
    }, userLabels);
  },

  enableSetting(settingName) {
    I.say('Attempting to open settings menu'); 
    I.click('[aria-label=Settings]');
    I.see('Settings');
    I.say('Attempt to enable setting');
    I.click(settingName);
    I.seeCheckboxIsChecked(settingName);
    I.click('[aria-label=Close]');
    I.dontSee('Settings');
  },

  disableSetting(settingName) {
    I.say('Attempting to open settings menu'); 
    I.click('[aria-label=Settings]');
    I.see('Settings');
    I.say('Attempt to disable setting');
    I.click(settingName);
    I.seeCheckboxIsChecked(settingName);
    I.click('[aria-label=Close]');
    I.dontSee('Settings');
  },
};

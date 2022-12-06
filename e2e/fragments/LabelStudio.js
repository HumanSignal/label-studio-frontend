const { I } = inject();
const Helpers = require('../tests/helpers');
const Asserts = require('../utils/asserts');

module.exports = {
  init({ events = {}, ...params }) {
    I.executeScript(Helpers.createLabelStudioInitFunction(params));
    for (const [eventName, callback] of Object.entries(events)) {
      this.on(eventName, callback);
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
};

/* global inject */

const { I } = inject();
const Helpers = require("../tests/helpers");

module.exports = {
  init(params) {
    I.executeScript(Helpers.initLabelStudio, params);
  },
  async serialize() {
    const result = await I.executeScript(Helpers.serialize);

    return result;
  },

  setFeatureFlags(featureFlags) {
    I.executeScript(Helpers.setFeatureFlags, featureFlags);
  },

  waitForObjectsReady() {
    I.executeScript(Helpers.waitForObjectsReady);
  },
};

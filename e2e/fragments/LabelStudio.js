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

  hasFF(fflag) {
    return I.executeScript(Helpers.hasFF, fflag);
  },

  setFeatureFlags(featureFlags) {
    I.executeScript(Helpers.setFeatureFlags, featureFlags);
  },

  waitForObjectsReady() {
    I.executeScript(Helpers.waitForObjectsReady);
  },
};

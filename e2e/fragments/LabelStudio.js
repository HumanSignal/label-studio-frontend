/* global inject */

const { I } = inject();
const Helpers = require("../tests/helpers");

module.exports = {
  init(params) {
    I.executeAsyncScript(Helpers.initLabelStudio, params);
  },
  async serialize() {
    const result = await I.executeScript(Helpers.serialize);

    return result;
  },

  setFeatureFlags(featureFlags) {
    I.executeAsyncScript(Helpers.setFeatureFlags, featureFlags);
  },
};

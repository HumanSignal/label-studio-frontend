/* global inject */
const { I } = inject();

const Helpers = require("../tests/helpers");

module.exports = {
  waitForAudio () {
    I.executeAsyncScript(Helpers.waitForAudio);
  },
};

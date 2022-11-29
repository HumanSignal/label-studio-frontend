/* global inject */
const { I } = inject();

const Helpers = require('../tests/helpers');

module.exports = {
  waitForAudio() {
    I.executeScript(Helpers.waitForAudio);
  },
  getCurrentAudioTime() {
    return I.executeScript(Helpers.getCurrentAudioTime);
  },
};

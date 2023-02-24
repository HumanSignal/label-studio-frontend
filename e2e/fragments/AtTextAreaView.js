/* global inject */
const { I } = inject();
const assert = require('assert');

module.exports = {
  _inputSelector: '.ant-form-horizontal .ant-form-item .ant-form-item-control .ant-form-item-control-input .ant-form-item-control-input-content input',

  addNewTextTag(value) {
    I.fillField(this._inputSelector, value);
    I.pressKeyDown('Enter');
  },

  /**
   * Asserts whether the audio player is reporting as paused.
   * @returns {Promise<void>}
   */
  async seeIsPlaying(playing) {
    const isPaused = await I.grabAttributeFrom(this._audioElementSelector, 'paused');

    assert.equal(!isPaused, playing, playing ? 'Audio is not playing' : 'Audio is playing');
  },
};

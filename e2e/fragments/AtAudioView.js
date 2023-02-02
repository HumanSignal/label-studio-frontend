/* global inject */
const { I } = inject();

const Helpers = require('../tests/helpers');

module.exports = {
  _stageSelector: '#waveform-layer-main',
  _progressBarSelector: 'loading-progress-bar',
  _stageBbox: { x: 0, y: 0, width: 0, height: 0 },

  async lookForStage() {
    I.scrollPageToTop();
    const bbox = await I.grabElementBoundingRect(this._stageSelector);

    this._stageBbox = bbox;
  },
  async waitForAudio() {
    await I.executeScript(Helpers.waitForAudio);
    I.waitForInvisible(this._progressBarSelector);
  },
  getCurrentAudioTime() {
    return I.executeScript(Helpers.getCurrentAudioTime);
  },
  /**
   * Mousedown - mousemove - mouseup drawing on the AudioView. Works in couple of lookForStage.
   * @example
   * await AtAudioView.lookForStage();
   * AtAudioView.dragAudioRegion(50, 200);
   * @param x {number}
   * @param shiftX {number}
   */
  dragAudioRegion(x, shiftX) {
    I.scrollPageToTop();
    I.moveMouse(this._stageBbox.x + x, this._stageBbox.y + this._stageBbox.height / 2);
    I.pressMouseDown();
    I.moveMouse(this._stageBbox.x + x + shiftX, this._stageBbox.y + this._stageBbox.height / 2, 3);
    I.pressMouseUp();
    I.wait(1);
  },

  clickAt(x) {
    I.scrollPageToTop();
    I.clickAt(this._stageBbox.x + x, this._stageBbox.y + this._stageBbox.height / 2);
    I.wait(1); // We gotta  wait here because clicks on the canvas are not processed immediately
  },
};

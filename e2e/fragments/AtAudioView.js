/* global inject */
const { I } = inject();

const Helpers = require('../tests/helpers');

module.exports = {
  _stageSelector: '#waveform-layer-main',
  _stageAUltra: { x: 0, y: 0, width: 0, height: 0 },

  async lookForStage() {
    I.scrollPageToTop();
    const audioUltra = await I.grabElementBoundingRect(this._stageSelector);

    this._stageAUltra = audioUltra;
  },
  async waitForAudio() {
    await I.executeScript(Helpers.waitForAudio);
  },
  getCurrentAudioTime() {
    return I.executeScript(Helpers.getCurrentAudioTime);
  },
  /**
   * Mousedown - mousemove - mouseup drawing on the AudioView. Works in couple of lookForStage.
   * @example
   * async atAudioView.lookForStage();
   * atAudioView.drawByDrag(50, 200);
   * @param x
   * @param shiftX
   */
  dragAudioRegion(x, shiftX) {
    I.scrollPageToTop();
    I.moveMouse(this._stageAUltra.x + x, this._stageAUltra.y + 40);
    I.pressMouseDown();
    I.moveMouse(this._stageAUltra.x + x + shiftX, this._stageAUltra.y + 40, 3);
    I.pressMouseUp();
    I.wait(1);
  },

  clickAt(x) {
    I.scrollPageToTop();
    I.clickAt(this._stageAUltra.x + x, this._stageAUltra.y + 40);
    I.wait(1); // We gotta  wait here because clicks on the canvas are not processed immediately
  },
};

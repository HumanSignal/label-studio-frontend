/* global inject */
const { I } = inject();

const Helpers = require("../tests/helpers");

module.exports = {
  _waveCanvasSelector: "wave canvas",
  _waveCanvasBBox: { x: 0, y: 0, width: 0, height: 0 },

  waitForAudio() {
    I.executeScript(Helpers.waitForAudio);
  },
  getCurrentAudioTime() {
    return I.executeScript(Helpers.getCurrentAudioTime);
  },

  async lookForWaveCanvas() {
    I.scrollPageToTop();
    const bbox = await I.grabElementBoundingRect(this._waveCanvasSelector);

    this._waveCanvasBBox = bbox;
  },

  /**
   * Mousedown - mousemove - mouseup drawing a region on the Audio wave. Works in conjunction with lookForWaveCanvas.
   * @example
   * await  AtAudioView.lookForWaveCanvas();
   * AtAudioView.drawByDrag(50, 200);
   * @param x {number}
   * @param shiftX {number}
   */
  drawByDrag(x,shiftX) {
    I.scrollPageToTop();
    I.moveMouse(this._waveCanvasBBox.x + x, this._waveCanvasBBox.y + this._waveCanvasBBox.height / 2);
    I.pressMouseDown();
    I.moveMouse(this._waveCanvasBBox.x + x + shiftX, this._waveCanvasBBox.y + this._waveCanvasBBox.height / 2, 3);
    I.pressMouseUp();
  },
};

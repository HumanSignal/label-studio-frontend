/* global inject */
const { I } = inject();

const Helpers = require("../tests/helpers");

module.exports = {
  _rootSelector: ".htx-timeseries",
  get _channelStageSelector() {
    return `${this._rootSelector} .htx-timeseries-channel .new_brush`;
  },
  _stageBBox: { x: 0, y: 0, width: 0, height: 0 },

  async lookForStage() {
    I.scrollPageToTop();
    const bbox = await I.grabElementBoundingRect(this._channelStageSelector);

    this._stageBBox = bbox;
  },

  /**
   * Mousedown - mousemove - mouseup drawing a region on the first Channel. Works in conjunction with lookForStage.
   * @example
   * await AtTimeSeries.lookForStage();
   * AtTimeseries.drawByDrag(50, 200);
   * @param x
   * @param shiftX
   */
  drawByDrag(x,shiftX) {
    I.scrollPageToTop();
    I.moveMouse(this._stageBBox.x + x, this._stageBBox.y + this._stageBBox.height / 2);
    I.pressMouseDown();
    I.moveMouse(this._stageBBox.x + x + shiftX, this._stageBBox.y + this._stageBBox.height / 2, 3);
    I.pressMouseUp();
  },
};

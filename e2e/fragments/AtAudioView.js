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

  async createRegion(tagName, start, length) {
    const { x, y, height } = await this.getWrapperPosition(tagName);

    return I.dragAndDropMouse({
      x: x + start,
      y: y + height / 2,
    }, {
      x: x + start + length,
      y: y + height / 2,
    });
  },

  async getWrapperPosition(tagName) {
    const wrapperPosition = await I.executeScript((tagName) => {
      const wrapper = Htx.annotationStore.selected.names.get(tagName)._ws.container;
      const bbox = wrapper.getBoundingClientRect();

      return {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      };
    }, tagName);

    return wrapperPosition;
  },

  async moveRegion(regionId, offset = 30) {
    const regionPosition = await I.executeScript((regionId) => {
      const region = Htx.annotationStore.selected.regions.find(r => r.cleanId === regionId);
      const element = region.getRegionElement();
      const rect = element.getBoundingClientRect();

      return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
    }, regionId);

    return I.dragAndDropMouse(regionPosition, {
      x: regionPosition.x + offset,
      y: regionPosition.y,
    });
  },
};

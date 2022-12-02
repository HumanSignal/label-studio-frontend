const { I } = inject();

const Helpers = require('../tests/helpers');

module.exports = {
  waitForAudio() {
    I.executeScript(Helpers.waitForAudio);
  },

  getCurrentAudioTime() {
    return I.executeScript(Helpers.getCurrentAudioTime);
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

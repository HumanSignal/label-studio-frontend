const { I } = inject();
const Helpers = require('../tests/helpers');

module.exports = {
  _rootSelector: '.lsf-htx-richtext',
  async selectTextByGlobalOffset(startOffset, endOffset) {
    const coords = await I.executeScript(Helpers.getSelectionCoordinates, {
      selector: '.lsf-htx-richtext',
      rangeStart: startOffset,
      rangeEnd: endOffset,
    });

    const start = {
      x: coords[0].x,
      y: coords[0].y + coords[0].height / 2,
    };

    const end = {
      x: coords[1].x,
      y: coords[1].y + coords[1].height / 2,
    };

    await I.dragAndDropMouse(start, end);
  },
  setSelection(startLocator, startOffset, endLocator, endOffset) {
    I.setSelection(startLocator, startOffset, endLocator, endOffset);
  },
  dblClickOnWord(word, parent) {
    const locator = this.locate(parent);

    I.dblClickOnWord(word, locator);
  },
  dblClickOnElement(locator) {
    I.dblClickOnElement(this.locate(locator));
  },
  locate(locator) {
    return locator ? locate(locator).inside(this.locateRoot()) : this.locateRoot();
  },
  locateRoot() {
    return locate(this._rootSelector);
  },
  locateText(locator) {
    return locate(this.locate(locator).toXPath() + '//text()');
  },
};

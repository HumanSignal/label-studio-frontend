/* global inject, locate */

const { I } = inject();
const Helpers = require("../tests/helpers");

module.exports = {
  _rootSelector: ".htx-richtext",
  selectTextByGlobalOffset (startOffset, endOffset) {
    I.executeAsyncScript(Helpers.selectText, {
      selector: ".htx-richtext",
      rangeStart: startOffset,
      rangeEnd: endOffset,
    });
  },
  setSelection (startLocator, startOffset, endLocator, endOffset) {
    I.setSelection(startLocator, startOffset, endLocator, endOffset);
  },
  dblClickOnWord (word, parent) {
    const locator = this.locate(parent);

    I.dblClickOnWord(word, locator);
  },
  locate (locator) {
    return locator ? locate(locator).inside(this.locateRoot()) : this.locateRoot();
  },
  locateRoot () {
    return locate(this._rootSelector);
  },
  locateText (locator) {
    return locate(this.locate(locator).toXPath() + "/text()");
  },
};

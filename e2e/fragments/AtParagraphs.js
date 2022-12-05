/* global inject, locate */

const { I } = inject();

module.exports = {
  _rootSelector: '.lsf-paragraphs',
  _filterSelector: '.lsf-select__value',
  setSelection(startLocator, startOffset, endLocator, endOffset) {
    I.setSelection(startLocator, startOffset, endLocator, endOffset);
  },
  locate(locator) {
    return locator ? locate(locator).inside(this.locateRoot()) : this.locateRoot();
  },
  locateRoot() {
    return locate(this._rootSelector);
  },
  locateText(text) {
    const locator = locate(`${this.locateRoot().toXPath()}//*[starts-with(@class,'phrase--')]//*[contains(@class,'text--')]//text()[contains(.,'${text}')]`);

    return locator;
  },

  clickFilter(...authors) {
    I.click(this.locate(this._filterSelector));
    for (const author of authors) {
      I.fillField('search_author', author);
      I.click(locate('.lsf-select__option').withText(author));
    }
    I.click(this.locate(this._filterSelector));
  },
};

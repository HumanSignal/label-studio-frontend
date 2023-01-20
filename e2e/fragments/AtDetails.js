/* global inject, locate */
const { I } = inject();

module.exports = {
  _rootSelector: '.lsf-details',
  _labelSelector: '.lsf-region-meta__content .lsf-tag',
  _textSelector: '.lsf-region-meta__content_type_text',
  _editMetaSelector: '[aria-label="Edit region\'s meta"]',
  _metaField: '.lsf-detailed-region__meta-text',
  _resultBlockSelector: '.lsf-detailed-region__result',
  _resultTitleSelector: '.ant-typography',
  _resultValueSelector: '.lsf-region-meta__value',
  locateDetailPanel() {
    return locate(this._rootSelector);
  },
  locate(locator) {
    return locator ? locate(locator).inside(this.locateDetailPanel()) : this.locateDetailPanel();
  },
  locateMeta() {
    return this.locate(this._metaField);
  },
  locateResultBlock() {
    return this.locate(this._resultBlockSelector);
  },
  locateResultRating(rating) {
    const locator = this.locateResultBlock().withDescendant(locate(this._resultTitleSelector).withText('Rating'));

    if (typeof rating === 'undefined') return locator;

    return locator.withDescendant(locate(this._resultValueSelector).withText(`${rating}`));
  },
  locateResultTextarea(text) {
    const locator = this.locateResultBlock().withDescendant(locate(this._resultTitleSelector).withText('Text'));

    if (typeof text === 'undefined') return locator;

    if (!Array.isArray(text)) text = [text];
    for (const line of text) {
      locator.withDescendant(locate(this._resultValueSelector).withText(line));
    }
    return locator;
  },
  locateResultChoices(value) {
    const locator = this.locateResultBlock().withDescendant(locate(this._resultTitleSelector).withText('Choices'));

    if (typeof value === 'undefined') return locator;

    if (!Array.isArray(value)) value = [value];

    return locator.withDescendant(locate(this._resultValueSelector).withText(value.join(', ')));
  },
  locateLabel(text) {
    return text ? locate(this._labelSelector).withText(`${text}`) : locate(this._labelSelector);
  },
  locateText(text) {
    return text ? locate(this._textSelector).withText(`${text}`) : locate(this._textSelector);
  },
  clickEditMeta() {
    I.click(this.locate(this._editMetaSelector));
  },
  fillMeta(text) {
    I.fillField(this.locateMeta(), text);
  },
  seeMeta(text) {
    I.see(text, this.locateMeta());
  },
  dontSeeMeta(text) {
    I.dontSee(text, this.locateMeta());
  },
  clickMeta() {
    I.click(this.locateMeta());
  },
  seeLabel(text) {
    I.seeElement(this.locateLabel(text));
  },
  seeLabels(count) {
    count && I.seeElement(this.locateLabel().at(count));
    I.dontSeeElement(this.locateLabel().at(count + 1));
  },
  seeText(text) {
    I.seeElement(this.locateText(text));
  },
  seeResultRating(rating) {
    I.seeElement(this.locateResultRating(rating));
  },
  seeResultTextarea(text) {
    I.seeElement(this.locateResultTextarea(text));
  },
  seeResultChoices(value) {
    I.seeElement(this.locateResultChoices(value));
  },
};
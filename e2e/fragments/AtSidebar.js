/* global inject, locate */
const { I } = inject();

module.exports = {
  _sideBarLocator: locate(".lsf-sidebar-tabs"),
  _regionGroupButton: locate(".lsf-radio-group__button"),
  _regionsCounterLocator: locate(".lsf-entities__counter"),
  _regionLocator: locate(".lsf-region-item"),
  seeRegions(count) {
    if (count) {
      I.see(`Regions\n\u00A0${count}`, this._sideBarLocator);
    } else {
      I.seeElement(this._regionGroupButton.withText("Regions"));
      I.dontSeeElement(this._regionGroupButton.withDescendant(this._regionsCounterLocator));
    }
  },
  dontSeeRegions(count) {
    if (count) {
      I.dontSee(`Regions\n\u00A0${count}`, this._sideBarLocator);
    } else if (count===+count) {
      I.seeElement(this._regionGroupButton.withDescendant(this._regionsCounterLocator));
    } else {
      I.dontSee("Regions", this._sideBarLocator);
    }
  },
  locate(locator) {
    return locate(this._sideBarLocator).find(locator);
  },
  see(text) {
    I.see(text, this._sideBarLocator);
  },
  dontSee(text) {
    I.dontSee(text, this._sideBarLocator);
  },
  seeElement(locator) {
    I.seeElement(this.locate(locator));
  },
  clickRegion(text) {
    I.click(this._regionLocator.withText(`${text}`));
  },
};

const { assert } = require("assert");

/* global inject, locate */
const { I } = inject();

module.exports = {
  _sideBarLocator: locate(".lsf-sidebar-tabs"),
  _regionGroupButton: locate(".lsf-radio-group__button"),
  _regionsCounterLocator: locate(".lsf-entities__counter"),
  _regionLocator: locate(".lsf-region-item"),
  _selectedRegionsLocator: locate(".lsf-entity"),
  seeRegions(count) {
    if (count) {
      I.seeElement(this._regionsCounterLocator.withText(`${count}`));
    } else {
      I.seeElement(this._regionGroupButton.withText("Regions"));
      I.dontSeeElement(this._regionGroupButton.withDescendant(this._regionsCounterLocator));
    }
  },
  dontSeeRegions(count) {
    if (count) {
      I.dontSeeElement(this._regionsCounterLocator.withText(`${count}`));
    } else if (count === +count) {
      I.seeElement(this._regionGroupButton.withDescendant(this._regionsCounterLocator));
    } else {
      I.dontSee("Regions", this._sideBarLocator);
    }
  },
  seeRelations(count) {
    I.see(`Relations (${count})`, this._sideBarLocator);
  },
  dontSeeRelations() {
    I.dontSee(`Relations`, this._sideBarLocator);
  },
  seeSelectedRegion() {
    I.seeElement(this._selectedRegionsLocator);
  },
  dontSeeSelectedRegion() {
    I.dontSeeElement(this._selectedRegionsLocator);
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
  selectTool(tool) {
    I.click(`[aria-label=${tool}-tool]`);
  },
};

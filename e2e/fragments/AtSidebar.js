/* global inject, locate */
const { I } = inject();

module.exports = {
  _sideBarLocator: locate(".lsf-sidebar-tabs"),
  _regionsCounterLocator: locate(".lsf-entities__counter"),
  seeRegions(count) {
    I.see(count ? `Regions\n\u00A0${count}`: "Regions", this._sideBarLocator);
  },
  dontSeeRegions(count) {
    if (count) {
      I.dontSee(`Regions\n\u00A0${count}`, this._sideBarLocator);
    } else {
      I.dontSeeElement(this._regionsCounterLocator);
    }
  },
  locate(locator) {
    return locate(this._sideBarLocator).find(locator);
  },
  see(text) {
    I.see(text, this._sideBarLocator);
  },
  seeElement(locator) {
    I.seeElement(this.locate(locator));
  }
};

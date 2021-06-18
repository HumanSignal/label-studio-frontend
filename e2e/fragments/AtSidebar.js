/* global inject, locate */
const { I } = inject();

module.exports = {
  _sideBarLocator: locate(".lsf-sidebar-tabs"),
  seeRegions(count) {
    I.see(`${count} Region${count === 0 || count > 1 ? "s" : ""}`, this._sideBarLocator);
  },
  dontSeeRegions(count) {
    I.dontSee(`${count} Region${count === 0 || count > 1 ? "s" : ""}`, this._sideBarLocator);
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

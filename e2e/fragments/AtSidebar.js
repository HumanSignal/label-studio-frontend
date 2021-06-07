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
  see(text) {
    I.see(text, this._sideBarLocator);
  },
};

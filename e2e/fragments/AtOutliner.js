/* global inject, locate */
const { I } = inject();

module.exports = {
  _rootSelector: '.lsf-outliner',
  _regionListSelector: '.lsf-outliner-tree',
  _regionListItemSelector: '.lsf-tree__node',
  _regionListItemIndex: '.lsf-outliner-item__index',
  locateOutliner() {
    return locate(this._rootSelector);
  },
  locate(locator) {
    return locator ? locate(locator).inside(this.locateOutliner()) : this.locateOutliner();
  },
  locateRegionList() {
    return this.locate(this._regionListSelector);
  },
  locateRegionItemList() {
    return locate(this._regionListItemSelector).inside(this.locateRegionList());
  },
  locateRegionItemIndex(idx) {
    return locate(this._regionListItemIndex).withText(`${idx}`).inside(this.locateRegionItemList());
  },
  seeRegions(count) {
    count && I.seeElement(this.locateRegionItemList().at(count));
    I.dontSeeElement(this.locateRegionItemList().at(count + 1));
  },
  clickRegion(idx) {
    I.click(this.locateRegionItemIndex(idx));
  },
};
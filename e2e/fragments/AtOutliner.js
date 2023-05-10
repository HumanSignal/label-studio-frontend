const { centerOfBbox } = require('../tests/helpers');
const { I } = inject();

module.exports = {
  _rootSelector: '.lsf-outliner',
  _regionListSelector: '.lsf-outliner-tree',
  _regionListItemSelector: '.lsf-tree__node',
  _regionListItemSelectedSelector: '.lsf-tree-node-selected',
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
  locateSelectedItem(locator) {
    const selectedLocator = locate(this._regionListItemSelectedSelector).inside(this.locateRegionList());

    return locator ? selectedLocator.find(locator) : selectedLocator;
  },
  seeRegions(count) {
    count && I.seeElement(this.locateRegionItemList().at(count));
    I.dontSeeElement(this.locateRegionItemList().at(count + 1));
  },
  clickRegion(idx) {
    I.click(this.locateRegionItemIndex(idx));
  },
  seeSelectedRegion() {
    I.seeElement(this.locateSelectedItem());
  },
  dontSeeSelectedRegion() {
    I.dontSeeElement(this.locateSelectedItem());
  },
  /**
   * Drag and drop region through the outliner's regions tree
   * @param {number} dragRegionIdx - Index of the dragged region
   * @param {number} dropRegionIdx - Index of the region that will be a drop zone
   * @param {number} [steps=3] - Sends intermediate mousemove events.
   * @returns {Promise<void>}
   */
  async dragAndDropRegion(dragRegionIdx, dropRegionIdx, steps = 3) {
    const fromBbox = await I.grabElementBoundingRect(this.locateRegionItemIndex(dragRegionIdx));
    const toBbox = await I.grabElementBoundingRect(this.locateRegionItemIndex(dropRegionIdx));
    const fromPoint = centerOfBbox(fromBbox);
    const toPoint = {
      x: toBbox.x + toBbox.width / 2,
      y: toBbox.y + 3 * toBbox.height / 4,
    };

    return await I.dragAndDropMouse(
      fromPoint,
      toPoint,
      'left',
      steps,
    );
  },
};

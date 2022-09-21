const { assert } = require("assert");

/* global inject, locate */
const { I, LabelStudio } = inject();

module.exports = {
  _sideBarLocator: locate(".lsf-sidebar-tabs"),
  _regionGroupButton: locate(".lsf-radio-group__button"),
  _regionsCounterLocator: locate(".lsf-entities__counter"),
  _regionLocator: locate(".lsf-region-item"),
  _selectedRegionsLocator: locate(".lsf-entity"),
  _outlinerRegionTree: locate(".lsf-outliner-tree"),
  _outlinerRegionTreeNodes: locate(".lsf-tree__node"),
  _outlinerEmpty: locate(".lsf-outliner__empty"),
  _outlinerSelectedRegionLocator: locate(".lsf-tree__node .lsf-tree-node-selected"),
  async seeRegions(count) {
    const hasFFDev1170 = await LabelStudio.hasFF("ff_front_1170_outliner_030222_short");

    if (count) {
      if(hasFFDev1170) {
        I.seeElement(this._outlinerRegionTree.withDescendant(this._outlinerRegionTreeNodes.at(count)));
      } else {
        I.seeElement(this._regionsCounterLocator.withText(`${count}`));
      }
    } else {
      if(hasFFDev1170) {
        I.seeElement(this._outlinerEmpty);
      } else {
        I.seeElement(this._regionGroupButton.withText("Regions"));
        I.dontSeeElement(this._regionsCounterLocator);
      }
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
  async seeSelectedRegion() {
    const hasFFDev1170 = await LabelStudio.hasFF("ff_front_1170_outliner_030222_short");

    if(hasFFDev1170) {
      I.seeElement(this._outlinerSelectedRegionLocator);
    } else {
      I.seeElement(this._selectedRegionsLocator);
    }
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

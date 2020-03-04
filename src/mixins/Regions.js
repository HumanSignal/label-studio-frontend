import { types } from "mobx-state-tree";
import { cloneNode } from "../core/Helpers";

const RegionsMixin = types
  .model({
    readonly: types.optional(types.boolean, false),
    selected: types.optional(types.boolean, false),
    highlighted: types.optional(types.boolean, false),
  })
  .actions(self => ({
    moveTop(size) {},
    moveBottom(size) {},
    moveLeft(size) {},
    moveRight(size) {},

    sizeRight(size) {},
    sizeLeft(size) {},
    sizeTop(size) {},
    sizeBottom(size) {},

    updateAppearenceFromState() {},

    updateSingleState(state) {
      var foundIndex = self.states.findIndex(s => s.name == state.name);
      self.states[foundIndex] = cloneNode(state);
      self.updateAppearenceFromState();
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);

      self.completion.loadRegionState(self);
    },

    unselectRegion() {
      const completion = self.completion;

      if (completion.relationMode) {
        completion.stopRelationMode();
      }

      self.selected = false;
      self.completion.setHighlightedNode(null);

      self.completion.unloadRegionState(self);
    },

    onClickRegion() {
      console.log("onClickRegion");

      const completion = self.completion;
      if (!completion.edittable) return;

      if (completion.relationMode) {
        completion.addRelation(self);
        completion.stopRelationMode();
        completion.regionStore.unselectAll();
      } else {
        if (self.selected) {
          self.unselectRegion();
        } else {
          completion.regionStore.unselectAll();
          self.selectRegion();
        }
      }
    },

    /**
     * Remove region
     */
    deleteRegion() {
      if (!self.completion.edittable) return;

      self.unselectRegion();

      self.completion.relationStore.deleteNodeRelation(self);

      if (self.type === "polygonregion") {
        self.destroyRegion();
      }

      self.completion.regionStore.deleteRegion(self);

      self.completion.deleteRegion(self);
    },

    setHighlight(val) {
      self.highlighted = val;
    },

    toggleHighlight() {
      self.setHighlight(!self.highlighted);
    },
  }));

export default RegionsMixin;

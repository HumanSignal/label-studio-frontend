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

    serialize() {
      console.error("Region class needs to implement serialize");
    },

    toStateJSON() {
      const parent = self.parent;
      const buildTree = control => {
        const tree = {
          id: self.pid,
          from_name: control.name,
          to_name: parent.name,
          source: parent.value,
          type: control.type,
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states.map(s => {
          const tree = {
            ...buildTree(s),
            ...self.serialize(s, parent),
          };

          // in case of labels it's gonna be, labels: ["label1", "label2"]
          tree["value"][s.type] = s.getSelectedNames();

          return tree;
        });
      } else {
        const obj = self.completion.toNames.get(parent.name);
        const control = obj.length ? obj[0] : obj;

        const tree = {
          ...buildTree(control),
          ...self.serialize(control, parent),
        };

        return tree;
      }
    },

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

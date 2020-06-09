import { types, getParent, getRoot } from "mobx-state-tree";
import { cloneNode } from "../core/Helpers";
import { guidGenerator } from "../core/Helpers";

const RegionsMixin = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

    score: types.maybeNull(types.number),
    readonly: types.optional(types.boolean, false),

    hidden: types.optional(types.boolean, false),

    selected: types.optional(types.boolean, false),
    highlighted: types.optional(types.boolean, false),
  })
  .views(self => ({
    get perRegionStates() {
      const states = self.states;
      return states && states.filter(s => s.perregion === true);
    },

    get store() {
      return getRoot(self);
    },

    get parent() {
      return getParent(self);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get editable() {
      return self.readonly === false && self.completion.editable === true;
    },

    get labelsState() {
      return self.states.find(s => s.type.indexOf("labels") !== -1);
    },

    hasLabelState(labelValue) {
      // first of all check if this region implements labels
      // interface
      const s = self.labelsState;
      if (!s) return false;

      // find that label and check if its selected
      const l = s.findLabel(labelValue);
      if (!l || !l.selected) return false;

      return true;
    },
  }))
  .actions(self => ({
    moveTop(size) {},
    moveBottom(size) {},
    moveLeft(size) {},
    moveRight(size) {},

    sizeRight(size) {},
    sizeLeft(size) {},
    sizeTop(size) {},
    sizeBottom(size) {},

    // update region appearence based on it's current states, for
    // example bbox needs to update its colors when you change the
    // label, becuase it takes color from the label
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
        return self.states
          .map(s => {
            const ser = self.serialize(s, parent);
            if (!ser) return null;

            const tree = {
              ...buildTree(s),
              ...ser,
            };

            // in case of labels it's gonna be, labels: ["label1", "label2"]

            return tree;
          })
          .filter(Boolean);
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

    updateOrAddState(state) {
      var foundIndex = self.states.findIndex(s => s.name === state.name);
      if (foundIndex !== -1) {
        self.states[foundIndex] = cloneNode(state);
        self.updateAppearenceFromState();
      } else {
        self.states.push(cloneNode(state));
      }
    },

    // given the specific state object (for example labels) it finds
    // that inside the region states objects and updates that, this
    // function is used to capture the state
    updateSingleState(state) {
      var foundIndex = self.states.findIndex(s => s.name === state.name);
      if (foundIndex !== -1) {
        self.states[foundIndex] = cloneNode(state);

        // user is updating the label of the region, there might
        // be other states that depend on the value of the region,
        // therefore we need to recheck here
        if (state.type.indexOf("labels") !== -1) {
          const states = self.states.filter(s => s.whenlabelvalue !== null && s.whenlabelvalue !== undefined);
          states && states.forEach(s => self.states.remove(s));
        }

        self.updateAppearenceFromState();
      }
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);

      self.completion.loadRegionState(self);
    },

    /**
     * Common logic for unselection; specific actions should be in `afterUnselectRegion`
     * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
     */
    unselectRegion(tryToKeepStates = false) {
      const completion = self.completion;
      const parent = self.parent;
      const keepStates = tryToKeepStates && self.store.settings.continuousLabeling;

      if (completion.relationMode) {
        completion.stopRelationMode();
      }
      if (parent.setSelected) {
        parent.setSelected(undefined);
      }

      self.selected = false;
      completion.setHighlightedNode(null);

      self.afterUnselectRegion();

      if (!keepStates) {
        completion.unloadRegionState(self);
      }
    },

    afterUnselectRegion() {},

    onClickRegion() {
      const completion = self.completion;
      if (!completion.editable) return;

      if (completion.relationMode) {
        completion.addRelation(self);
        completion.stopRelationMode();
        completion.regionStore.unselectAll();
      } else {
        if (self.selected) {
          self.unselectRegion(true);
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
      if (!self.completion.editable) return;

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

    toggleHidden() {
      self.hidden = !self.hidden;
    },
  }));

export default RegionsMixin;

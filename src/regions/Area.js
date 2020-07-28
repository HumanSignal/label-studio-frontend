import { types, getParent, getRoot } from "mobx-state-tree";
import { cloneNode } from "../core/Helpers";
import { guidGenerator } from "../core/Helpers";
import Registry from "../core/Registry";
import { RectRegionModel } from "./RectRegion";

const ImageArea = types
  .model("ImageArea", {
    original_width: types.maybe(types.number),
    original_height: types.maybe(types.number),
    image_rotation: 0,

    x: types.number,
    y: types.number,
    width: types.number,
    height: types.number,
    rotation: types.number,
  })
  .actions(self => ({
    serialize() {
      const { original_width, original_height, image_rotation, x, y, width, height, rotation } = self;
      return {
        original_width,
        original_height,
        image_rotation,
        value: { x, y, width, height, rotation },
      };
    },
  }));

const serializeDataWithLength = self => () => {
  const { original_length, ...value } = self;
  return { original_length, value };
};

const AudioArea = types
  .model("AudioArea", {
    original_length: types.number,

    start: types.number,
    end: types.number,
  })
  .actions(self => ({
    serialize: serializeDataWithLength(self),
  }));

const TextArea = types
  .model("TextArea", {
    original_length: types.number,

    start: types.number,
    end: types.number,
    // don't store if savetextresult="no"
    text: types.maybe(types.string),
  })
  .actions(self => ({
    serialize: serializeDataWithLength(self),
  }));

const HyperTextArea = types
  .model("HyperTextArea", {
    original_length: types.number,

    start: types.string,
    end: types.string,
    startOffset: types.number,
    endOffset: types.number,
    // @todo implement savetextresult for HyperText
    text: types.string,
  })
  .actions(self => ({
    serialize: serializeDataWithLength(self),
  }));

const EmptyArea = types.model("EmptyArea", {}).actions(self => ({
  serialize: () => ({}),
}));

const Area = types
  .model("Area", {
    id: types.identifier,
    // pid: types.optional(types.string, guidGenerator),

    score: types.maybeNull(types.number),
    // @todo to readonly mixin
    // readonly: types.optional(types.boolean, false),

    // @why?
    // hidden: types.optional(types.boolean, false),

    // @todo to mixins
    // selected: types.optional(types.boolean, false),
    // highlighted: types.optional(types.boolean, false),

    // @todo pid?
    // parentID: types.optional(types.string, ""),

    // ImageRegion, TextRegion, HyperTextRegion, AudioRegion)),
    data: types.union(RectRegionModel, AudioArea, TextArea, HyperTextArea, EmptyArea),
    object: types.reference(types.union(...Registry.objectTypes())),
    type: "",
    // info about object and region
    // meta: types.frozen(),
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
    setParentID(id) {
      self.parentID = id;
    },

    // update region appearence based on it's current states, for
    // example bbox needs to update its colors when you change the
    // label, becuase it takes color from the label
    updateAppearenceFromState() {},

    serialize() {
      return self.data.serialize();
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
          parent_id: self.parentID === "" ? null : self.parentID,
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

export default Area;

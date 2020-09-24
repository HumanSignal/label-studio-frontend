import { types, getParent, getRoot, getSnapshot } from "mobx-state-tree";
import { cloneNode } from "../core/Helpers";
import { guidGenerator } from "../core/Helpers";
import Registry from "../core/Registry";

const Result = types
  .model("Result", {
    id: types.optional(types.identifier, guidGenerator),
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
    // optional for classifications
    // labeling tag
    from_name: types.late(() => types.reference(types.union(...Registry.modelsArr()))),
    // object tag
    to_name: types.late(() => types.reference(types.union(...Registry.objectTypes()))),
    type: types.enumeration([
      "labels",
      "htmllabels",
      "rectangle",
      "keypoint",
      "polygon",
      "brush",
      "ellipse",
      "rectanglelabels",
      "keypointlabels",
      "polygonlabels",
      "brushlabels",
      "ellipselabels",
      "choices",
      "textarea",
      "rating",
    ]),
    value: types.model({
      rating: types.maybe(types.number),
      text: types.maybe(types.union(types.string, types.array(types.string))),
      choices: types.maybe(types.array(types.string)),
      // @todo all other *labels
      labels: types.maybe(types.array(types.string)),
      htmllabels: types.maybe(types.array(types.string)),
      rectanglelabels: types.maybe(types.array(types.string)),
      keypointlabels: types.maybe(types.array(types.string)),
      polygonlabels: types.maybe(types.array(types.string)),
      ellipselabels: types.maybe(types.array(types.string)),
      brushlabels: types.maybe(types.array(types.string)),
    }),
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

    get area() {
      return getParent(self, 2);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get mainValue() {
      return self.value[self.from_name.valueType];
    },

    get hasValue() {
      const value = self.mainValue;
      if (!value) return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },

    get editable() {
      return self.readonly === false && self.completion.editable === true;
    },

    get labelsState() {
      return self.states.find(s => s.type.indexOf("labels") !== -1);
    },

    getSelectedString(joinstr = " ") {
      return self.mainValue?.join(joinstr) || "";
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

    get selectedLabels() {
      return self.mainValue?.map(value => self.from_name.findLabel(value)).filter(Boolean);
    },

    getOneColor() {
      return self.style && self.style.fillcolor;
    },

    get tag() {
      const value = self.mainValue;
      console.log("VVV", self.value);
      if (!value) return null;
      return self.from_name.findLabel(value[0]);
    },

    get style() {
      if (!self.tag) return null;
      const fillcolor = self.tag.background || self.tag.parent.fillcolor;
      if (!fillcolor) return null;
      const strokecolor = self.tag.background || self.tag.parent.strokecolor;
      const { strokewidth, fillopacity, opacity } = self.tag.parent;
      return { strokecolor, strokewidth, fillcolor, fillopacity, opacity };
    },
  }))
  .volatile(self => ({
    pid: "",
    selected: false,
    // highlighted: types.optional(types.boolean, false),
  }))
  .actions(self => ({
    setValue(value) {
      self.value[self.from_name.valueType] = value;
    },

    afterCreate() {
      self.pid = self.id;
    },

    afterAttach() {
      const tag = self.from_name;
      // update state of classification tags
      // @todo unify this with `selectArea`
    },

    setParentID(id) {
      self.parentID = id;
    },

    // update region appearence based on it's current states, for
    // example bbox needs to update its colors when you change the
    // label, becuase it takes color from the label
    updateAppearenceFromState() {},

    serialize() {
      const { from_name, to_name, type, score, value } = getSnapshot(self);
      const { valueType } = self.from_name;
      const data = self.area ? self.area.serialize() : {};
      if (!data) return null;
      // cut off completion id
      const id = self.area.cleanId;
      if (!data.value) data.value = {};

      Object.assign(data, { id, from_name, to_name, type });
      value[valueType] && Object.assign(data.value, { [valueType]: value[valueType] });
      if (typeof score === "number") data.score = score;

      return data;
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
      self.area.selectRegion();
      self.completion.setHighlightedNode(self.area);

      // self.completion.loadRegionState(self);
    },

    /**
     * Common logic for unselection; specific actions should be in `afterUnselectRegion`
     * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
     */
    unselectRegion(tryToKeepStates = false) {
      console.log("UNSELECT RESULT");
      return;
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

export default Result;

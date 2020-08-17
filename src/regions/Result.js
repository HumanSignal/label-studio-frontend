import { types, getParent, getRoot, getSnapshot } from "mobx-state-tree";
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
    // labeling/control tag
    from_name: types.late(() => types.reference(types.union(...Registry.modelsArr()))),
    // object tag
    to_name: types.late(() => types.reference(types.union(...Registry.objectTypes()))),
    // @todo some general type, maybe just a `string`
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
      "timeserieslabels",
      "choices",
      "taxonomy",
      "textarea",
      "rating",
      "pairwise",
    ]),
    // @todo much better to have just a value, not a hash with empty fields
    value: types.model({
      rating: types.maybe(types.number),
      text: types.maybe(types.union(types.string, types.array(types.string))),
      choices: types.maybe(types.array(types.string)),
      // pairwise
      selected: types.maybe(types.enumeration(["left", "right"])),
      // @todo all other *labels
      labels: types.maybe(types.array(types.string)),
      htmllabels: types.maybe(types.array(types.string)),
      rectanglelabels: types.maybe(types.array(types.string)),
      keypointlabels: types.maybe(types.array(types.string)),
      polygonlabels: types.maybe(types.array(types.string)),
      ellipselabels: types.maybe(types.array(types.string)),
      brushlabels: types.maybe(types.array(types.string)),
      timeserieslabels: types.maybe(types.array(types.string)),
      taxonomy: types.frozen(), // array of arrays of strings
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

    getSelectedString(joinstr = " ") {
      return self.mainValue?.join(joinstr) || "";
    },

    get selectedLabels() {
      return self.mainValue?.map(value => self.from_name.findLabel(value)).filter(Boolean);
    },

    /**
     * Checks perRegion and Visibility params
     */
    get isSubmitable() {
      const control = self.from_name;

      if (control.perregion) {
        const label = control.whenlabelvalue;
        if (label && !self.area.hasLabel(label)) return false;
      }

      if (control.visiblewhen === "choice-selected") {
        const tagName = control.whentagname;
        const choiceValues = control.whenchoicevalue ? control.whenchoicevalue.split(",") : null;
        const results = self.completion.results.filter(r => r.type === "choices" && r !== self);
        if (tagName) {
          const result = results.find(r => r.from_name.name === tagName);
          if (!result) return false;
          if (choiceValues && !choiceValues.some(v => result.mainValue.includes(v))) return false;
        } else {
          if (!results.length) return false;
          // if no given choice value is selected in any choice result
          if (choiceValues && !choiceValues.some(v => results.some(r => r.mainValue.includes(v)))) return false;
        }
      }

      return true;
    },

    get tag() {
      const value = self.mainValue;
      if (!value) return null;
      if (!self.from_name.findLabel) return null;
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
      // const tag = self.from_name;
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
      if (!self.isSubmitable) return null;
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

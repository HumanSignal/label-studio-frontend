import { getParent, getRoot, getSnapshot, types } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";
import Registry from "../core/Registry";
import { AnnotationMixin } from "../mixins/AnnotationMixin";
import { isDefined } from "../utils/utilities";
import { FF_DEV_1372, FF_DEV_2007, isFF } from "../utils/feature-flags";

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
      "hypertextlabels",
      "paragraphlabels",
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
      "number",
      "taxonomy",
      "textarea",
      "rating",
      "pairwise",
      "videorectangle",
    ]),
    // @todo much better to have just a value, not a hash with empty fields
    value: types.model({
      number: types.maybe(types.number),
      rating: types.maybe(types.number),
      text: types.maybe(types.union(types.string, types.array(types.string))),
      ...(isFF(FF_DEV_2007)
        ? { choices: types.maybe(types.array(types.union(types.string, types.array(types.string)))) }
        : { choices: types.maybe(types.array(types.string)) }
      ),
      // pairwise
      selected: types.maybe(types.enumeration(["left", "right"])),
      // @todo all other *labels
      labels: types.maybe(types.array(types.string)),
      htmllabels: types.maybe(types.array(types.string)),
      hypertextlabels: types.maybe(types.array(types.string)),
      paragraphlabels: types.maybe(types.array(types.string)),
      rectanglelabels: types.maybe(types.array(types.string)),
      keypointlabels: types.maybe(types.array(types.string)),
      polygonlabels: types.maybe(types.array(types.string)),
      ellipselabels: types.maybe(types.array(types.string)),
      brushlabels: types.maybe(types.array(types.string)),
      timeserieslabels: types.maybe(types.array(types.string)),
      taxonomy: types.frozen(), // array of arrays of strings
      sequence: types.frozen(),
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

    get mainValue() {
      return self.value[self.from_name.valueType];
    },

    mergeMainValue(value) {
      value =  value?.toJSON ? value.toJSON() : value;
      const mainValue = self.mainValue?.toJSON?.() ? self.mainValue?.toJSON?.() : self.mainValue;

      if (typeof value !== typeof mainValue) return null;
      if (self.type.endsWith("labels")) {
        return value.filter(x => mainValue.includes(x));
      }
      return value === mainValue ? value : null;
    },

    get hasValue() {
      const value = self.mainValue;

      if (!isDefined(value)) return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },

    get editable() {
      // @todo readonly is not defined here, so we have to fix this
      // @todo and as it's used only in region list view of textarea get rid of this getter
      return !self.readonly && self.annotation.editable === true && self.area.editable === true;
    },

    getSelectedString(joinstr = " ") {
      return self.mainValue?.join(joinstr) || "";
    },

    get selectedLabels() {
      if (self.mainValue?.length === 0 && self.from_name.allowempty) {
        return self.from_name.findLabel(null);
      }
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

      const isChoiceSelected = () => {
        const tagName = control.whentagname;
        const choiceValues = control.whenchoicevalue ? control.whenchoicevalue.split(",") : null;
        const results = self.annotation.results.filter(r => r.type === "choices" && r !== self);

        if (tagName) {
          const result = results.find(r => {
            if (r.from_name.name !== tagName) return false;
            // for perRegion choices we should check that they are in the same area
            return !r.from_name.perregion || r.area === self.area;
          });

          if (!result) return false;
          if (choiceValues && !choiceValues.some(v => result.mainValue.includes(v))) return false;
        } else {
          if (!results.length) return false;
          // if no given choice value is selected in any choice result
          if (choiceValues && !choiceValues.some(v => results.some(r => r.mainValue.includes(v)))) return false;
        }
        return true;
      };

      if (control.visiblewhen === "choice-selected") {
        return isChoiceSelected();
      } else if (isFF(FF_DEV_1372) && control.visiblewhen === "choice-unselected") {
        return !isChoiceSelected();
      }

      return true;
    },

    get tag() {
      const value = self.mainValue;

      if (!value || !value.length) return null;
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

    get emptyStyle() {
      const emptyLabel = self.from_name.emptyLabel;

      if (!emptyLabel) return null;
      const fillcolor = emptyLabel.background || emptyLabel.parent.fillcolor;

      if (!fillcolor) return null;
      const strokecolor = emptyLabel.background || emptyLabel.parent.strokecolor;
      const { strokewidth, fillopacity, opacity } = emptyLabel.parent;

      return { strokecolor, strokewidth, fillcolor, fillopacity, opacity };
    },

    get controlStyle() {
      if (!self.from_name) return null;

      const { fillcolor, strokecolor, strokewidth, fillopacity, opacity } = self.from_name;

      return { strokecolor, strokewidth, fillcolor, fillopacity, opacity };
    },
  }))
  .volatile(() => ({
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

    serialize(options) {
      const { from_name, to_name, type, score, value } = getSnapshot(self);
      const { valueType } = self.from_name;
      const data = self.area ? self.area.serialize(options) : {};

      if (!data) return null;
      if (!self.isSubmitable) return null;
      // with `mergeLabelsAndResults` control uses only one result even with external `Labels`
      if (type === "labels" && self.to_name.mergeLabelsAndResults) return null;
      // cut off annotation id
      const id = self.area.cleanId;

      if (!isDefined(data.value)) data.value = {};

      const contolMeta = self.from_name.metaValue;

      if (contolMeta) {
        data.meta = { ...data.meta, ...contolMeta };
      }
      const areaMeta = self.area.meta;

      if (areaMeta && Object.keys(areaMeta).length) {
        data.meta = { ...data.meta, ...areaMeta };
      }

      if (self.area.parentID) {
        data.parentID = self.area.parentID.replace(/#.*/, "");
      }

      Object.assign(data, { id, from_name, to_name, type, origin: self.area.origin });

      if (isDefined(value[valueType])) {
        Object.assign(data.value, { [valueType]: value[valueType] });
      }

      if (typeof score === "number") data.score = score;

      if (!self.editable) data.readonly = true;

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
        const obj = self.annotation.toNames.get(parent.name);
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
      if (!self.annotation.editable) return;

      self.unselectRegion();

      self.annotation.relationStore.deleteNodeRelation(self);

      if (self.type === "polygonregion") {
        self.destroyRegion();
      }

      self.annotation.regionStore.deleteRegion(self);

      self.annotation.deleteRegion(self);
    },

    setHighlight(val) {
      self._highlighted = val;
    },

    toggleHighlight() {
      self.setHighlight(!self._highlighted);
    },

    toggleHidden() {
      self.hidden = !self.hidden;
    },
  }));

export default types.compose(Result, AnnotationMixin);

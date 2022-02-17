import { destroy, types } from "mobx-state-tree";
import { guidGenerator } from "../core/Helpers";
import Result from "../regions/Result";
import { defaultStyle } from "../core/Constants";
import { PER_REGION_MODES } from "./PerRegion";

let ouid = 1;

export const AreaMixin = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    ouid: types.optional(types.number, () => ouid++),
    results: types.array(Result),
    parentID: types.maybeNull(types.string),
  })
  .views(self => ({
    // self id without annotation id added to uniquiness across all the tree
    get cleanId() {
      return self.id.replace(/#.*/, "");
    },

    get labeling() {
      return self.results.find(r => r.type.endsWith("labels") && r.hasValue);
    },

    get emptyLabel() {
      return self.results.find(r => r.from_name?.emptyLabel)?.from_name?.emptyLabel;
    },

    get texting() {
      return self.results.find(r => r.type === "textarea" && r.hasValue);
    },

    get tag() {
      return self.labeling?.from_name;
    },

    hasLabel(value) {
      const labels = self.labeling?.mainValue;

      if (!labels) return false;
      // label can contain comma, so check for full match first
      if (labels.includes(value)) return true;
      if (value.includes(",")) {
        return value.split(",").some(v => labels.includes(v));
      }
      return false;
    },

    get perRegionTags() {
      return self.annotation.toNames.get(self.object.name)?.filter(tag => tag.perregion) || [];
    },

    get perRegionDescControls() {
      return self.perRegionTags.filter(tag => tag.displaymode === PER_REGION_MODES.REGION_LIST);
    },

    get perRegionFocusTarget() {
      return self.perRegionTags.find(tag => tag.isVisible !== false && tag.focusable);
    },

    get labelName() {
      return self.labeling?.mainValue?.[0] || self.emptyLabel?._value;
    },

    get labels() {
      return Array.from(self.labeling?.mainValue ?? []);
    },

    getLabelText(joinstr) {
      const label = self.labeling;
      const text = self.texting?.mainValue?.[0]?.replace(/\n\r|\n/, " ");
      const labelNames = label?.getSelectedString(joinstr);
      const labelText = [];

      if (labelNames) labelText.push(labelNames);
      if (text) labelText.push(text);
      return labelText.join(": ");
    },

    get parent() {
      return self.object;
    },

    get style() {
      const styled = self.results.find(r => r.style);

      if (styled && styled.style) {
        return styled.style;
      }
      const emptyStyled = self.results.find(r => r.emptyStyle);

      if (emptyStyled && emptyStyled.emptyStyle) {
        return emptyStyled.emptyStyle;
      }

      const controlStyled = self.results.find(r => self.type.startsWith(r.type));

      return controlStyled && controlStyled.controlStyle;
    },

    // @todo may be slow, consider to add some code to annotation (un)select* methods
    get selected() {
      return self.annotation?.highlightedNode === self;
    },

    getOneColor() {
      return (self.style || defaultStyle).fillcolor;
    },

    get highlighted() {
      return self.parent?.selectionArea?.isActive ? self.isInSelectionArea : self._highlighted;
    },

    get isInSelectionArea() {
      return self.parent?.selectionArea?.isActive ? self.parent.selectionArea.intersectsBbox(self.bboxCoords) : false;
    },
  }))
  .volatile(() => ({
    // selected: false,
  }))
  .actions(self => ({
    beforeDestroy() {
      self.results.forEach(r => destroy(r));
    },

    setSelected(value) {
      self.selected = value;
    },

    /**
     * Remove region
     */
    deleteRegion() {
      if (!self.annotation.editable) return;
      if (self.selected) self.annotation.unselectAll(true);
      if (self.destroyRegion) self.destroyRegion();
      self.annotation.deleteRegion(self);
    },

    addResult(r) {
      self.results.push(r);
    },

    removeResult(r) {
      const index = self.results.indexOf(r);

      if (index < 0) return;
      self.results.splice(index, 1);
      destroy(r);
      if (!self.results.length) self.annotation.deleteArea(self);
    },

    setValue(tag) {
      const result = self.results.find(r => r.from_name === tag);
      const values = tag.selectedValues();

      if (result) {
        if (tag.holdsState) result.setValue(values);
        else self.removeResult(result);
      } else {
        self.results.push({
          area: self,
          from_name: tag,
          to_name: self.object,
          type: tag.resultType,
          value: {
            [tag.valueType]: values,
          },
        });
      }
      self.updateAppearenceFromState && self.updateAppearenceFromState();
    },
  }));

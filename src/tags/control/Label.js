import ColorScheme from "pleasejs";
import React from "react";
import { Tag } from "antd";
import { getRoot, types } from "mobx-state-tree";
import { observer, inject } from "mobx-react";

import Hint from "../../components/Hint/Hint";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Constants from "../../core/Constants";
import Types from "../../core/Types";
import Utils from "../../utils";
import { guidGenerator } from "../../core/Helpers";
import { runTemplate } from "../../core/Template";

/**
 * Label tag represents a single label
 * @example
 * <View>
 *   <Labels name="type" toName="txt-1">
 *     <Label alias="B" value="Brand" />
 *     <Label alias="P" value="Product" />
 *   </Labels>
 *   <Text name="txt-1" value="$text" />
 * </View>
 * @name Label
 * @param {string} value                    - value of the label
 * @param {boolean} [selected=false]        - if this label should be preselected
 * @param {number} [maxUsages]              - maximum available usages
 * @param {string} [hotkey]                 - hotkey, if not specified then will be automatically generated
 * @param {string} [alias]                  - label alias
 * @param {boolean} [showAlias=false]       - show alias inside label text
 * @param {string} [aliasStyle=opacity:0.6] - alias CSS style
 * @param {string} [size=medium]            - size of text in the label
 * @param {string} [background]             - background color of an active label
 * @param {string} [selectedColor]          - color of text in an active label
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  selected: types.optional(types.boolean, false),
  maxUsages: types.maybeNull(types.number),
  alias: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  showalias: types.optional(types.boolean, false),
  aliasstyle: types.optional(types.string, "opacity: 0.6"),
  size: types.optional(types.string, "medium"),
  background: types.optional(types.string, Constants.LABEL_BACKGROUND),
  selectedcolor: types.optional(types.string, "white"),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    type: "label",
    visible: types.optional(types.boolean, true),
    _value: types.optional(types.string, ""),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },

    usedAlready() {
      const regions = self.completion.regionStore.regions;
      // count all the usages among all the regions
      const used = regions.reduce((s, r) => s + r.hasLabelState(self.value), 0);
      return used;
    },

    canBeUsed() {
      const maxUsages = self.maxUsages || self.parent.maxUsages;
      if (!maxUsages) return true;
      return self.usedAlready() < maxUsages;
    },

    get parent() {
      return Types.getParentOfTypeString(self, [
        "LabelsModel",
        "EllipseLabelsModel",
        "RectangleLabelsModel",
        "PolygonLabelsModel",
        "KeyPointLabelsModel",
        "BrushLabelsModel",
        "HyperTextLabelsModel",
      ]);
    },
  }))
  .actions(self => ({
    /**
     * Select label
     */
    toggleSelected() {
      // here we check if you click on label from labels group
      // connected to the region on the same object tag that is
      // right now highlighted, and if that region is readonly
      const region = self.completion.highlightedNode;
      if (region && region.readonly === true && region.parent.name === self.parent.toname) return;

      // one more check if that label can be selected
      if (!self.completion.editable) return;

      // don't select if it can not be used
      if (!self.selected && !self.canBeUsed()) return;

      const labels = self.parent;

      // check if there is a region selected and if it is and user
      // is changing the label we need to make sure that region is
      // not going to endup without the label(s) at all
      if (region) {
        const sel = labels.selectedLabels;
        if (sel.length === 1 && sel[0]._value === self._value) return;
      }

      /**
       * Multiple
       */
      if (!labels.shouldBeUnselected) {
        self.setSelected(!self.selected);
      }

      /**
       * Single
       */
      if (labels.shouldBeUnselected) {
        /**
         * Current not selected
         */
        if (!self.selected) {
          labels.unselectAll();
          self.setSelected(!self.selected);
        } else {
          labels.unselectAll();
        }
      }

      region && region.updateSingleState(labels);
    },

    setVisible(val) {
      self.visible = val;
    },

    /**
     *
     * @param {boolean} value
     */
    setSelected(value) {
      self.selected = value;
    },

    onHotKey() {
      return self.toggleSelected();
    },

    _updateBackgroundColor(val) {
      if (self.background === Constants.LABEL_BACKGROUND) self.background = ColorScheme.make_color({ seed: val })[0];
    },

    afterCreate() {
      self._updateBackgroundColor(self._value || self.value);
    },

    updateValue(store) {
      self._value = runTemplate(self.value, store.task.dataObj) || "";
      self._updateBackgroundColor(self._value);
    },
  }));

const LabelModel = types.compose("LabelModel", TagAttrs, Model, ProcessAttrsMixin);

const HtxLabelView = inject("store")(
  observer(({ item, store }) => {
    const bg = item.background;
    const labelStyle = {
      backgroundColor: item.selected ? bg : "#e8e8e8",
      color: item.selected ? item.selectedcolor : "#333333",
      cursor: "pointer",
      margin: "5px",
    };

    if (!item.visible) {
      labelStyle["display"] = "none";
    }

    return (
      <Tag
        onClick={ev => {
          item.toggleSelected();
          return false;
        }}
        style={labelStyle}
        size={item.size}
      >
        {item._value}
        {item.showalias === true && item.alias && (
          <span style={Utils.styleToProp(item.aliasstyle)}>&nbsp;{item.alias}</span>
        )}
        {(store.settings.enableTooltips || store.settings.enableLabelTooltips) &&
          store.settings.enableHotkeys &&
          item.hotkey && <Hint>[{item.hotkey}]</Hint>}
      </Tag>
    );
  }),
);

Registry.addTag("label", LabelModel, HtxLabelView);

export { HtxLabelView, LabelModel };

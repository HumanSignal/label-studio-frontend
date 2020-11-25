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
import InfoModal from "../../components/Infomodal/Infomodal";
import { customTypes } from "../../core/CustomTypes";

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
 * @param {symbol|word} [granularity]       - control per symbol or word selection (only for Text)
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  selected: types.optional(types.boolean, false),
  maxusages: types.maybeNull(types.string),
  alias: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  showalias: types.optional(types.boolean, false),
  aliasstyle: types.optional(types.string, "opacity: 0.6"),
  size: types.optional(types.string, "medium"),
  background: types.optional(customTypes.color, Constants.LABEL_BACKGROUND),
  selectedcolor: types.optional(customTypes.color, "#ffffff"),
  granularity: types.maybeNull(types.enumeration(["symbol", "word", "sentence", "paragraph"])),
  groupcancontain: types.maybeNull(types.string),
  // childrencheck: types.optional(types.enumeration(["any", "all"]), "any")
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

    get maxUsages() {
      return Number(self.maxusages || self.parent.maxusages);
    },

    usedAlready() {
      const regions = self.completion.regionStore.regions;
      // count all the usages among all the regions
      const used = regions.reduce((s, r) => s + r.hasLabel(self.value), 0);
      return used;
    },

    canBeUsed() {
      if (!self.maxUsages) return true;
      return self.usedAlready() < self.maxUsages;
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
        "TimeSeriesLabelsModel",
        "ParagraphLabelsModel",
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
      const sameObject = region && region.parent.name === self.parent.toname;
      if (region && region.readonly === true && sameObject) return;

      // one more check if that label can be selected
      if (!self.completion.editable) return;

      // don't select if it can not be used
      if (!self.selected && !self.canBeUsed()) {
        InfoModal.warning(`You can't use ${self.value} more than ${self.maxUsages} time(s)`);
        return;
      }

      const labels = self.parent;

      // check if there is a region selected and if it is and user
      // is changing the label we need to make sure that region is
      // not going to endup without the label(s) at all
      if (region && sameObject) {
        if (labels.selectedLabels.length === 1 && self.selected) return;
      }

      // if we are going to select label and it would be the first in this labels group
      if (!labels.selectedLabels.length && !self.selected) {
        // unselect labels from other groups of labels connected to this obj
        self.completion.toNames
          .get(labels.toname)
          .filter(tag => tag.type && tag.type.endsWith("labels") && tag.name !== labels.name)
          .forEach(tag => tag.unselectAll && tag.unselectAll());

        // unselect other tools if they exist and selected
        const tool = Object.values(self.parent.tools || {})[0];
        if (tool && tool.manager.findSelectedTool() !== tool) {
          tool.manager.unselectAll();
          tool.setSelected(true);
        }
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

      region && sameObject && region.setValue(self.parent);
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
      borderLeftWidth: 3,
      borderLeftColor: bg,
      backgroundColor: item.selected ? bg : "#e8e8e8",
      color: item.selected ? item.selectedcolor : "#333333",
      cursor: "pointer",
      margin: "5px",
    };

    if (!item.visible) {
      labelStyle["display"] = "none";
    }

    if (item.selected) {
      labelStyle.borderTopColor = bg;
      labelStyle.borderBottomColor = bg;
      labelStyle.borderRightColor = bg;
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

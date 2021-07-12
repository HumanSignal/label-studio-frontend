import ColorScheme from "pleasejs";
import React from "react";
import { types } from "mobx-state-tree";
import { observer, inject } from "mobx-react";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Constants from "../../core/Constants";
import Utils from "../../utils";
import { parseValue } from "../../utils/data";
import { guidGenerator } from "../../core/Helpers";
import InfoModal from "../../components/Infomodal/Infomodal";
import { customTypes } from "../../core/CustomTypes";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { Label } from "../../components/Label/Label";
import { TagParentMixin } from "../../mixins/TagParentMixin";
import Types from "../../core/Types";

/**
 * Label tag represents a single label.
 * @example
 * <View>
 *   <Labels name="type" toName="txt-1">
 *     <Label alias="B" value="Brand" />
 *     <Label alias="P" value="Product" />
 *   </Labels>
 *   <Text name="txt-1" value="$text" />
 * </View>
 * @name Label
 * @param {string} value                    - Value of the label
 * @param {boolean} [selected=false]        - Whether to preselect this label
 * @param {number} [maxUsages]              - Maximum available uses of the label
 * @param {string} [hotkey]                 - Hotkey to use for the label. Automatically generated if not specified
 * @param {string} [alias]                  - Label alias
 * @param {boolean} [showAlias=false]       - Whether to show alias inside label text
 * @param {string} [aliasStyle=opacity:0.6] - Alias CSS style
 * @param {string} [size=medium]            - Size of text in the label
 * @param {string} [background=#36B37E]     - Background color of an active label
 * @param {string} [selectedColor=#ffffff]  - Color of text in an active label
 * @param {symbol|word} [granularity]       - Set control based on symbol or word selection (only for Text)
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

const Model = types.model({
  id: types.optional(types.identifier, guidGenerator),
  type: "label",
  visible: types.optional(types.boolean, true),
  _value: types.optional(types.string, ""),
  parentTypes: Types.tagsTypes([
    "Labels",
    "EllipseLabels",
    "RectangleLabels",
    "PolygonLabels",
    "KeyPointLabels",
    "BrushLabels",
    "HyperTextLabels",
    "TimeSeriesLabels",
    "ParagraphLabels"
  ])
}).volatile(self => {
  return {
    isEmpty: false
  };
}).views(self => ({
  get maxUsages() {
    return Number(self.maxusages || self.parent?.maxusages);
  },

  usedAlready() {
    const regions = self.annotation.regionStore.regions;
    // count all the usages among all the regions
    const used = regions.reduce((s, r) => s + r.hasLabel(self.value), 0);
    return used;
  },

  canBeUsed() {
    if (!self.maxUsages) return true;
    return self.usedAlready() < self.maxUsages;
  }
})).actions(self => ({
  setEmpty() {
    self.isEmpty = true;
  },
  /**
   * Select label
   */
  toggleSelected() {
    // here we check if you click on label from labels group
    // connected to the region on the same object tag that is
    // right now highlighted, and if that region is readonly
    const region = self.annotation.highlightedNode;
    const sameObject = region && region.parent?.name === self.parent?.toname;
    if (region && region.readonly === true && sameObject) return;

    // one more check if that label can be selected
    if (!self.annotation.editable) return;

    // don't select if it can not be used
    if (!self.selected && !self.canBeUsed()) {
      InfoModal.warning(`You can't use ${self.value} more than ${self.maxUsages} time(s)`);
      return;
    }

    const labels = self.parent;

    // check if there is a region selected and if it is and user
    // is changing the label we need to make sure that region is
    // not going to endup without results at all
    if (region && sameObject) {
      if (
        labels.selectedLabels.length === 1 &&
        self.selected &&
        region.results.length === 1 &&
        (!self.parent?.allowempty || self.isEmpty)
      )
        return;
      if (self.parent?.type !== "labels" && !self.parent?.type.includes(region?.results[0].type)) return;
    }

    // if we are going to select label and it would be the first in this labels group
    if (!labels.selectedLabels.length && !self.selected) {
      // unselect labels from other groups of labels connected to this obj
      self.annotation.toNames.get(labels.toname).
        filter(tag => tag.type && tag.type.endsWith("labels") && tag.name !== labels.name).
        forEach(tag => tag.unselectAll && tag.unselectAll());

      // unselect other tools if they exist and selected
      const tool = Object.values(self.parent?.tools || {})[0];
      if (tool && tool.manager.findSelectedTool() !== tool) {
        tool.manager.selectTool(tool, true);
      }
    }

    if (self.isEmpty) {
      let selected = self.selected;
      labels.unselectAll();
      self.setSelected(!selected);
    } else {
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
    }

    if (labels.allowempty && !self.isEmpty) {
      if (sameObject) {
        labels.findLabel().setSelected(!labels.selectedValues()?.length);
      } else {
        if (self.selected) {
          labels.findLabel().setSelected(false);
        }
      }
    }

    if (region && sameObject) {
      region.setValue(self.parent);

      // hack to trigger RichText re-render the region
      region.updateSpans?.();
    }
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
    self._value = parseValue(self.value, store.task.dataObj) || Constants.EMPTY_LABEL;
  },
}));

const LabelModel = types.compose("LabelModel", TagParentMixin, TagAttrs, ProcessAttrsMixin, Model, AnnotationMixin);

const HtxLabelView = inject("store")(
  observer(({ item, store }) => {
    const hotkey = (store.settings.enableTooltips || store.settings.enableLabelTooltips) && store.settings.enableHotkeys && item.hotkey;

    return <Label color={item.background} margins empty={item.isEmpty} hotkey={hotkey} hidden={!item.visible} selected={item.selected} onClick={ev => {
      item.toggleSelected();
      return false;
    }}>
      {item._value}
      {item.showalias === true && item.alias && (
        <span style={Utils.styleToProp(item.aliasstyle)}>&nbsp;{item.alias}</span>
      )}
    </Label>;
  }),
);

Registry.addTag("label", LabelModel, HtxLabelView);

export { HtxLabelView, LabelModel };

import React from "react";
import { observer, inject } from "mobx-react";
import { getType, getRoot, types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import SelectedGraphModelMixin from "../../mixins/SelectedGraphModel";
import Types from "../../core/Types";
import { LabelsModel } from "./Labels";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";
import ColorScheme from "pleasejs";
import Constants from "../../core/Constants";
import { Tag } from "antd";
import Hint from "../../components/Hint/Hint";
import Utils from "../../utils";
import { runTemplate } from "../../core/Template";
import InfoModal from "../../components/Infomodal/Infomodal";

/**
 * GraphLabel tag, create labeled graphs
 * @example
 * <View>
 *   <Image name="image" value="$image" />
 *   <GraphLabels>
 *     <GraphLabel value="labels" toName="image">
 *       <Vertex value="Car" />
 *       <Vertex value="Sign" />
 *       <Edge value="Sign" v1="Car", v2="Sign" />
 *     </GraphLabel>
 *   </GraphLabels>
 * </View>
 * @name GraphLabel
 * @param {string} value                            - name of tag
 * @param {string} toName                           - name of image to label
 * @param {number} [opacity=0.6]                    - opacity of graph
 * @param {string} [fillColor]                      - rectangle fill color, default is transparent
 * @param {string} [strokeColor]                    - stroke color
 * @param {number} [strokeWidth=1]                  - width of stroke
 * @param {small|medium|large} [vertexSize=medium]   - size of graph handle points
 * @param {rectangle|circle} [vertexStyle=rectangle] - style of points
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),
  selected: types.optional(types.boolean, false),
  maxusages: types.maybeNull(types.string),
  size: types.optional(types.string, "medium"),
  background: types.optional(types.string, Constants.LABEL_BACKGROUND),
  selectedcolor: types.optional(types.string, "white"),
  vertexsize: types.optional(types.string, "small"),
  vertexstyle: types.optional(types.string, "circle"),
});

const ModelAttrs = types.model("GraphLabelModel", {
  id: types.optional(types.identifier, guidGenerator),
  pid: types.optional(types.string, guidGenerator),
  type: "graphlabel",
  children: Types.unionArray(["vertex", "edge", "header", "view", "hypertext"]),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    type: "graphlabel",
    visible: types.optional(types.boolean, true),
    _value: types.optional(types.string, ""),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get parent() {
      return Types.getParentOfTypeString(self, ["GraphLabelsModel"]);
    },

    get maxUsages() {
      return Number(self.maxusages || self.parent.maxUsages);
    },

    usedAlready() {
      const regions = self.completion.regionStore.regions;
      // count all the usages among all the regions
      const used = regions.reduce((s, r) => s + r.hasLabelState(self.value), 0);
      return used;
    },

    canBeUsed() {
      if (!self.maxUsages) return true;
      return self.usedAlready() < self.maxUsages;
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
      if (!self.selected && !self.canBeUsed()) {
        InfoModal.warning(`You can't use ${self.value} more than ${self.maxUsages} time(s)`);
        return;
      }

      const labels = self.parent;

      // check if there is a region selected and if it is and user
      // is changing the label we need to make sure that region is
      // not going to endup without the label(s) at all
      if (region) {
        const sel = labels.selectedLabels;
        if (sel.length === 1 && sel[0]._value === self._value) return;
      }

      // if we are going to select label and it would be the first in this labels group
      if (!labels.selectedLabels.length && !self.selected) {
        // unselect labels from other groups of labels connected to this obj
        self.completion.toNames
          .get(labels.toname)
          .forEach(tag => tag.name !== labels.name && tag.unselectAll && tag.unselectAll());

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
      const children = self.tiedChildren;
      for (var i = 0; i < children.length; i++) {
        if (self.selected && getType(children[i]).name == self._vertex) {
          children[i].setSelected(true);
          break;
        } else {
          children[i].setSelected(false);
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

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  TagAttrs,
  Model,
  SelectedGraphModelMixin.props({ _vertex: "VertexModel", _edge: "EdgeModel" }),
  ControlBase,
);

const GraphLabelModel = types.compose("GraphLabelModel", Composition);

const HtxGraphLabel = inject("store")(
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

Registry.addTag("graphlabel", GraphLabelModel, HtxGraphLabel);

export { HtxGraphLabel, GraphLabelModel };

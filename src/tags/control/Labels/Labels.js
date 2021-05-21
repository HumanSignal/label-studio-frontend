import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import InfoModal from "../../../components/Infomodal/Infomodal";
import LabelMixin from "../../../mixins/LabelMixin";
import Registry from "../../../core/Registry";
import SelectedModelMixin from "../../../mixins/SelectedModel";
import Tree from "../../../core/Tree";
import Types from "../../../core/Types";
import { LabelModel } from "../Label"; // eslint-disable-line no-unused-vars
import { guidGenerator } from "../../../core/Helpers";
import ControlBase from "../Base";
import './Labels.styl';
import { Block } from "../../../utils/bem";

/**
 * Labels tag, create a group of labels.
 * @example
 * <View>
 *   <Labels name="type" toName="txt-1">
 *     <Label alias="B" value="Brand" />
 *     <Label alias="P" value="Product" />
 *   </Labels>
 *   <Text name="txt-1" value="$text" />
 * </View>
 * @name Labels
 * @param {string} name                      - Name of the element
 * @param {string} toName                    - Name of the element that you want to label
 * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]               - Maximum available uses of the label
 * @param {boolean} [showInline=true]        - Show items in the same visual line
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  choice: types.optional(types.enumeration(["single", "multiple"]), "single"),
  maxusages: types.maybeNull(types.string),
  showinline: types.optional(types.boolean, true),

  // TODO this will move away from here
  groupdepth: types.maybeNull(types.string),
});

/**
 * @param {boolean} showinline
 * @param {identifier} id
 * @param {string} pid
 */
const ModelAttrs = types.model({
  pid: types.optional(types.string, guidGenerator),
  type: "labels",
  children: Types.unionArray(["label", "header", "view", "text", "hypertext", "richtext"]),

  visible: types.optional(types.boolean, true),
});

const Model = LabelMixin.views(self => ({
  get shouldBeUnselected() {
    return self.choice === "single";
  },
})).actions(self => ({
  validate() {
    const regions = self.annotation.regionStore.regions;

    for (let r of regions) {
      for (let s of r.states) {
        if (s.name === self.name) {
          return true;
        }
      }
    }

    InfoModal.warning(self.requiredmessage || `Labels "${self.name}" were not used.`);
    return false;
  },
}));

const LabelsModel = types.compose(
  "LabelsModel",
  ModelAttrs,
  TagAttrs,
  Model,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const HtxLabels = observer(({ item }) => {
  return (
    <Block
      name="labels"
      mod={{hidden: !item.visible, inline: item.showinline}}
    >
      {Tree.renderChildren(item)}
    </Block>
  );
});

Registry.addTag("labels", LabelsModel, HtxLabels);

export { HtxLabels, LabelsModel };

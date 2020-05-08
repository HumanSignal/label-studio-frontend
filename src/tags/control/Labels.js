import React from "react";
import { observer } from "mobx-react";
import { types, getParent } from "mobx-state-tree";

import RequiredMixin from "../../mixins/Required";
import InfoModal from "../../components/Infomodal/Infomodal";
import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { LabelModel } from "./Label"; // eslint-disable-line no-unused-vars
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * Labels tag, create a group of labels
 * @example
 * <View>
 *   <Labels name="type" toName="txt-1">
 *     <Label alias="B" value="Brand" />
 *     <Label alias="P" value="Product" />
 *   </Labels>
 *   <Text name="txt-1" value="$text" />
 * </View>
 * @name Labels
 * @param {string} name                      - name of the element
 * @param {string} toName                    - name of the element that you want to label
 * @param {single|multiple=} [choice=single] - configure if you can select just one or multiple labels
 * @param {boolean} [required=false]   - validation if label is required
 * @param {string} [requiredMessage]   - message to show if validation fails
 * @param {boolean} [showInline=true]        - show items in the same visual line
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),

  choice: types.optional(types.enumeration(["single", "multiple"]), "single"),
  showinline: types.optional(types.boolean, true),
});

/**
 * @param {boolean} showinline
 * @param {identifier} id
 * @param {string} pid
 */
const ModelAttrs = types.model({
  id: types.optional(types.identifier, guidGenerator),
  pid: types.optional(types.string, guidGenerator),
  type: "labels",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),

  visible: types.optional(types.boolean, true),
});

const Model = LabelMixin.props({ _type: "labels" })
  .views(self => ({
    get shouldBeUnselected() {
      return self.choice === "single";
    },
  }))
  .actions(self => ({
    validate() {
      const regions = self.completion.regionStore.regions;

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
  RequiredMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const HtxLabels = observer(({ item }) => {
  const style = {
    marginTop: "1em",
    marginBottom: "1em",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexFlow: "wrap",
    marginLeft: "-5px",
  };

  if (!item.showinline) {
    style["flexDirection"] = "column";
    style["alignItems"] = "flex-start";
    style["marginTop"] = "0";
  }

  if (!item.visible) {
    style["display"] = "none";
  }

  return <div style={style}>{Tree.renderChildren(item)}</div>;
});

Registry.addTag("labels", LabelsModel, HtxLabels);

export { HtxLabels, LabelsModel };

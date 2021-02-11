import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * ParagraphLabels tag
 * ParagraphLabels tag creates labeled paragraph
 * @example
 * <View>
 *   <ParagraphLabels name="labels" toName="prg">
 *     <Label value="Face" />
 *     <Label value="Nose" />
 *   </ParagraphLabels>
 *   <Paragraphs name="prg" value="$dialogue" layout="dialogue" />
 * </View>
 * @name ParagraphLabels
 * @param {string} name name of the element
 * @param {string} toName name of the html element to label
 * @param {single|multiple=} [choice=single] - configure if you can select just one or multiple labels
 * @param {number} [maxUsages]               - maximum available usages
 * @param {boolean} [showInline=true]        - show items in the same visual line
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const ModelAttrs = types
  .model("ParagraphLabelesModel", {
    pid: types.optional(types.string, guidGenerator),
    type: "paragraphlabels",
    children: Types.unionArray(["label", "header", "view", "hypertext"]),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    get serializableValue() {
      const obj = {};
      obj["paragraphlabels"] = self.selectedValues();

      return obj;
    },
  }));

const Model = LabelMixin.props({ _type: "paragraphlabels" });

const Composition = types.compose(
  ControlBase,
  LabelsModel,
  ModelAttrs,
  TagAttrs,
  Model,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const ParagraphLabelsModel = types.compose("ParagraphLabelsModel", Composition);

const HtxParagraphLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("paragraphlabels", ParagraphLabelsModel, HtxParagraphLabels);

export { HtxParagraphLabels, ParagraphLabelsModel };

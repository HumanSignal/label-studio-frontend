import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { guidGenerator } from "../../core/Helpers";

/**
 * HyperTextLabels tag
 * HyperTextLabels tag creates labeled hyper text (HTML)
 * @example
 * <View>
 *   <HyperTextLabels name="labels" toName="ht">
 *     <Label value="Face" />
 *     <Label value="Nose" />
 *   </HyperTextLabels>
 *   <HyperText name="ht" value="$html" />
 * </View>
 * @name HyperTextLabels
 * @param {string} name name of the element
 * @param {string} toName name of the html element to label
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),
});

const ModelAttrs = types
  .model("HyperTextLabelesModel", {
    id: types.identifier,
    pid: types.optional(types.string, guidGenerator),
    type: "htmllabels",
    children: Types.unionArray(["label", "header", "view", "hypertext"]),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },
  }));

const Model = LabelMixin.props({ _type: "htmllabels" }).views(self => ({
  get shouldBeUnselected() {
    return self.choice === "single";
  },
}));

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  TagAttrs,
  Model,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const HyperTextLabelsModel = types.compose("HyperTextLabelsModel", Composition);

const HtxHyperTextLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("hypertextlabels", HyperTextLabelsModel, HtxHyperTextLabels);

export { HtxHyperTextLabels, HyperTextLabelsModel };

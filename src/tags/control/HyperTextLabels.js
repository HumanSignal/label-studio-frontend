import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import ControlBase from "./Base";

/**
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
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const Validation = types.model({
  controlledTags: Types.unionTag(["HyperText"]),
});

const ModelAttrs = types
  .model("HyperTextLabelesModel", {
    type: "htmllabels",
    children: Types.unionArray(["label", "header", "view", "hypertext"]),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    get serializableValue() {
      const obj = {};
      obj["htmllabels"] = self.selectedValues();

      return obj;
    },

    get resultType() {
      return "htmllabels";
    },

    get valueType() {
      return "htmllabels";
    },
  }));

const Composition = types.compose(
  ControlBase,
  LabelsModel,
  ModelAttrs,
  TagAttrs,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
);

const HyperTextLabelsModel = types.compose("HyperTextLabelsModel", Composition);

const HtxHyperTextLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("hypertextlabels", HyperTextLabelsModel, HtxHyperTextLabels);

export { HtxHyperTextLabels, HyperTextLabelsModel };

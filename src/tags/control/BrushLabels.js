import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { BrushModel } from "./Brush";
import { HtxLabels, LabelsModel } from "./Labels";
import ControlBase from "./Base";

/**
 * BrushLabels tag creates segmented labeling
 * @example
 * <View>
 *   <BrushLabels name="labels" toName="image">
 *     <Label value="Person" />
 *     <Label value="Animal" />
 *   </BrushLabels>
 *   <Image name="image" value="$image" />
 * </View>
 * @name BrushLabels
 * @param {string} name   - name of the element
 * @param {string} toName - name of the image to label
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types.model("BrushLabelsModel", {
  type: "brushlabels",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const BrushLabelsModel = types.compose(
  "BrushLabelsModel",
  LabelsModel,
  ModelAttrs,
  BrushModel,
  TagAttrs,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const HtxBrushLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("brushlabels", BrushLabelsModel, HtxBrushLabels);

export { HtxBrushLabels, BrushLabelsModel };

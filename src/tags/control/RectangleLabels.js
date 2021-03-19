import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { RectangleModel } from "./Rectangle";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * RectangleLabels tag creates labeled rectangles
 * Used only for Image
 * @example
 * <View>
 *   <RectangleLabels name="labels" toName="image">
 *     <Label value="Person" />
 *     <Label value="Animal" />
 *   </RectangleLabels>
 *   <Image name="image" value="$image" />
 * </View>
 * @name RectangleLabels
 * @param {string} name              - Name of the element
 * @param {string} toName            - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]               - Maximum available uses of the label
 * @param {boolean} [showInline=true]        - Show items in the same visual line
 * @param {float} [opacity=0.6]      - Opacity of rectangle
 * @param {string} [fillColor]       - Rectangle fill color
 * @param {string} [strokeColor]     - Stroke color
 * @param {number} [strokeWidth=1]   - Width of stroke
 * @param {boolean} [canRotate=true] - Show or hide rotation control
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types.model("RectangleLabelsModel", {
  pid: types.optional(types.string, guidGenerator),
  type: "rectanglelabels",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  RectangleModel,
  TagAttrs,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const RectangleLabelsModel = types.compose("RectangleLabelsModel", Composition);

const HtxRectangleLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("rectanglelabels", RectangleLabelsModel, HtxRectangleLabels);

export { HtxRectangleLabels, RectangleLabelsModel };

import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { EllipseModel } from "./Ellipse";
import ControlBase from "./Base";

/**
 * EllipseLabels tag creates labeled ellipses
 * Used only for Image
 * @example
 * <View>
 *   <EllipseLabels name="labels" toName="image">
 *     <Label value="Person" />
 *     <Label value="Animal" />
 *   </EllipseLabels>
 *   <Image name="image" value="$image" />
 * </View>
 * @name EllipseLabels
 * @param {string} name               - Name of the element
 * @param {string} toName             - Name of the image to label
 * @param {single|multiple=} [choice=single] - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]        - Maximum available uses of the label
 * @param {boolean} [showInline=true] - Show items in the same visual line
 * @param {float=} [opacity=0.6]      - Opacity of ellipse
 * @param {string=} [fillColor]       - Ellipse fill color
 * @param {string=} [strokeColor]     - Stroke color
 * @param {number=} [strokeWidth=1]   - Width of stroke
 * @param {boolean=} [canRotate=true] - Show or hide rotation handle
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const ModelAttrs = types.model("EllipseLabelsModel", {
  type: "ellipselabels",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  EllipseModel,
  TagAttrs,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const EllipseLabelsModel = types.compose("EllipseLabelsModel", Composition);

const HtxEllipseLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("ellipselabels", EllipseLabelsModel, HtxEllipseLabels);

export { HtxEllipseLabels, EllipseLabelsModel };

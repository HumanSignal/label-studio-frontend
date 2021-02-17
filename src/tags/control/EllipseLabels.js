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
 * @param {string} name               - name of the element
 * @param {string} toName             - name of the image to label
 * @param {single|multiple=} [choice=single] - configure if you can select just one or multiple labels
 * @param {number} [maxUsages]               - maximum available usages
 * @param {boolean} [showInline=true]        - show items in the same visual line
 * @param {float=} [opacity=0.6]      - opacity of rectangle
 * @param {string=} [fillColor]       - ellipse fill color, default is transparent
 * @param {string=} [strokeColor]     - stroke color
 * @param {number=} [strokeWidth=1]   - width of stroke
 * @param {boolean=} [canRotate=true] - show or hide rotation handle
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

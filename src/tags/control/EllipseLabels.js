import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels";
import { EllipseModel } from "./Ellipse";
import { guidGenerator } from "../../core/Helpers";

/**
 * EllipseLabels tag creates labeled ellipses
 * Used only for Image
 * @example
 * <View>
 *   <EllipseLabels name="labels" toName="image">
 *     <Label value="Person"></Label>
 *     <Label value="Animal"></Label>
 *   </EllipseLabels>
 *   <Image name="image" value="$image"></Image>
 * </View>
 * @name EllipseLabels
 * @param {string} name name of the element
 * @param {string} toname name of the image to label
 * @param {float=} [opacity=0.6] opacity of rectangle
 * @param {string=} fillColor rectangle fill color, default is transparent
 * @param {string=} strokeColor stroke color
 * @param {number=} [strokeWidth=1] width of stroke
 * @param {boolean=} [canRotate=true] show or hide rotation handle
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),
});

const ModelAttrs = types.model("EllipseLabelsModel", {
  id: types.optional(types.identifier, guidGenerator),
  pid: types.optional(types.string, guidGenerator),
  type: "ellipselabels",
  children: Types.unionArray(["labels", "label", "choice"]),
});

const Model = LabelMixin.props({ _type: "ellipselabels" }).views(self => ({
  get shouldBeUnselected() {
    return self.choice === "single";
  },
}));

const Composition = types.compose(LabelsModel, ModelAttrs, EllipseModel, TagAttrs, Model, SelectedModelMixin);

const EllipseLabelsModel = types.compose("EllipseLabelsModel", Composition);

const HtxEllipseLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("ellipselabels", EllipseLabelsModel, HtxEllipseLabels);

export { HtxEllipseLabels, EllipseLabelsModel };

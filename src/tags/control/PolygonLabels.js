import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import LabelMixin from "../../mixins/LabelMixin";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import Types from "../../core/Types";
import { HtxLabels, LabelsModel } from "./Labels/Labels";
import { PolygonModel } from "./Polygon";
import ControlBase from "./Base";

/**
 * PolygonLabels tag, create labeled polygons
 * @example
 * <View>
 *   <Image name="image" value="$image" />
 *   <PolygonLabels name="lables" toName="image">
 *     <Label value="Car" />
 *     <Label value="Sign" />
 *   </PolygonLabels>
 * </View>
 * @name PolygonLabels
 * @regions PolygonRegion
 * @meta_title Polygon Label Tags for Labeling Polygons in Images
 * @meta_description Label Studio Polygon Label Tags customize Label Studio for labeling polygons in images for machine learning and data science projects.
 * @param {string} name                             - Name of tag
 * @param {string} toName                           - Name of image to label
 * @param {single|multiple=} [choice=single]        - Configure whether you can select one or multiple labels
 * @param {number} [maxUsages]                      - Maximum available uses of the label
 * @param {boolean} [showInline=true]               - Show items in the same visual line
 * @param {number} [opacity=0.2]                    - Opacity of polygon
 * @param {string} [fillColor]                      - Polygon fill color
 * @param {string} [strokeColor]                    - Stroke color
 * @param {number} [strokeWidth=1]                  - Width of stroke
 * @param {small|medium|large} [pointSize=medium]   - Size of polygon handle points
 * @param {rectangle|circle} [pointStyle=rectangle] - Style of points
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const ModelAttrs = types.model("PolygonLabelsModel", {
  type: "polygonlabels",
  children: Types.unionArray(["label", "header", "view", "hypertext"]),
});

const Composition = types.compose(
  LabelsModel,
  ModelAttrs,
  PolygonModel,
  TagAttrs,
  Validation,
  LabelMixin,
  SelectedModelMixin.props({ _child: "LabelModel" }),
  ControlBase,
);

const PolygonLabelsModel = types.compose("PolygonLabelsModel", Composition);

const HtxPolygonLabels = observer(({ item }) => {
  return <HtxLabels item={item} />;
});

Registry.addTag("polygonlabels", PolygonLabelsModel, HtxPolygonLabels);

export { HtxPolygonLabels, PolygonLabelsModel };

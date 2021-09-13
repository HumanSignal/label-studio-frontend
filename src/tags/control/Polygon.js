import { types } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";
import { customTypes } from "../../core/CustomTypes";
import Types from "../../core/Types";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import SeparatedControlMixin from "../../mixins/SeparatedControlMixin";
import ToolsManager from "../../tools/Manager";

/**
 * Use the Polygon tag to add polygons to an image without selecting a label. This can be useful when you have only one label to assign to the polygon. Use for image segmentation tasks.
 *
 * Use with the following data types: image
 * @example
 * <!--Basic labeling configuration for polygonal image segmentation -->
 * <View>
 *   <Polygon name="rect-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name Polygon
 * @meta_title Polygon Tag for Adding Polygons to Images
 * @meta_description Customize Label Studio with the Polygon tag by adding polygons to images for segmentation machine learning and data science projects.
 * @param {string} name                           - Name of tag
 * @param {string} toname                         - Name of image to label
 * @param {number} [opacity=0.6]                  - Opacity of polygon
 * @param {string} [fillColor=transparent]        - Polygon fill color in hexadecimal or HTML color name
 * @param {string} [strokeColor=#f48a42]          - Stroke color in hexadecimal
 * @param {number} [strokeWidth=3]                - Width of stroke
 * @param {small|medium|large} [pointSize=small]  - Size of polygon handle points
 * @param {rectangle|circle} [pointStyle=circle]  - Style of points
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  opacity: types.optional(customTypes.range(), "0.2"),
  fillcolor: types.optional(customTypes.color, "#f48a42"),

  strokewidth: types.optional(types.string, "2"),
  strokecolor: types.optional(customTypes.color, "#f48a42"),

  pointsize: types.optional(types.string, "small"),
  pointstyle: types.optional(types.string, "circle"),
});

const Validation = types.model({
  controlledTags: Types.unionTag(["Image"]),
});

const Model = types
  .model({
    type: "polygon",

    // regions: types.array(RectRegionModel),
    _value: types.optional(types.string, ""),
  })
  .actions(self => ({
    fromStateJSON() {},

    afterCreate() {
      const manager = ToolsManager.getInstance();
      const env = { manager, control: self };

      const poly = Tools.Polygon.create({}, env);
      // const floodFill = Tools.FloodFill.create({}, env);

      self.tools = {
        poly,
        // floodfill: floodFill,
      };
    },
  }));

const PolygonModel = types.compose(
  "PolygonModel",
  ControlBase,
  AnnotationMixin,
  SeparatedControlMixin,
  TagAttrs,
  Validation,
  Model,
);

const HtxView = () => null;

Registry.addTag("polygon", PolygonModel, HtxView);

export { HtxView, PolygonModel };

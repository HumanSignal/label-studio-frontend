import { types } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";
import { customTypes } from "../../core/CustomTypes";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import SeparatedControlMixin from "../../mixins/SeparatedControlMixin";
import ToolsManager from "../../tools/Manager";

/**
 * Use the Rectangle tag to add a rectangle (Bounding Box) to an image without selecting a label. This can be useful when you have only one label to assign to a rectangle.
 *
 * Use with the following data types: image
 * @example
 * <!--Basic labeling configuration for adding rectangular bounding box regions to an image -->
 * <View>
 *   <Rectangle name="rect-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name Rectangle
 * @meta_title Rectangle Tag for Adding Rectangle Bounding Box to Images
 * @meta_description Customize Label Studio with the Rectangle tag to add rectangle bounding boxes to images for machine learning and data science projects.
 * @param {string} name                   - Name of the element
 * @param {string} toName                 - Name of the image to label
 * @param {float=} [opacity=0.6]          - Opacity of rectangle
 * @param {string=} [fillColor]           - Rectangle fill color in hexadecimal
 * @param {string=} [strokeColor=#f48a42] - Stroke color in hexadecimal
 * @param {number=} [strokeWidth=1]       - Width of the stroke
 * @param {boolean=} [canRotate=true]     - Whether to show or hide rotation control
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  opacity: types.optional(customTypes.range(), "1"),
  fillcolor: types.optional(customTypes.color, "#f48a42"),

  strokewidth: types.optional(types.string, "1"),
  strokecolor: types.optional(customTypes.color, "#f48a42"),
  fillopacity: types.optional(customTypes.range(), "0.2"),

  canrotate: types.optional(types.boolean, true),
});

const Model = types
  .model({
    type: "rectangle",
  })
  .actions(self => ({
    fromStateJSON() {},

    afterCreate() {
      const manager = ToolsManager.getInstance();
      const env = { manager, control: self };

      const rect = Tools.Rect.create({ activeShape: null }, env);

      self.tools = { rect };
    },
  }));

const RectangleModel = types.compose("RectangleModel", ControlBase, AnnotationMixin, SeparatedControlMixin, TagAttrs, Model);

const HtxView = () => {
  return null;
};

Registry.addTag("rectangle", RectangleModel, HtxView);

export { HtxView, RectangleModel };

import { types, getRoot } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";

/**
 * Rectangle
 * Rectangle is used to add rectangle (Bounding Box) to an image
 * @example
 * <View>
 *   <Rectangle name="rect-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name Rectangle
 * @param {string} name                   - name of the element
 * @param {string} toName                 - name of the image to label
 * @param {float=} [opacity=0.6]          - opacity of rectangle
 * @param {string=} [fillColor]           - rectangle fill color, default is transparent
 * @param {string=} [strokeColor=#f48a42] - stroke color
 * @param {number=} [strokeWidth=1]       - width of the stroke
 * @param {boolean=} [canRotate=true]     - show or hide rotation handle
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),

  opacity: types.optional(types.string, "0.6"),
  fillcolor: types.optional(types.string, "#f48a42"),

  strokewidth: types.optional(types.string, "1"),
  strokecolor: types.optional(types.string, "#f48a42"),
  fillopacity: types.optional(types.string, "0.6"),

  canrotate: types.optional(types.boolean, true),
});

const Model = types
  .model({
    id: types.identifier,
    type: "rectangle",
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    afterCreate() {
      const rect = Tools.Rect.create({ activeShape: null });
      rect._control = self;

      self.tools = { rect: rect };
    },
  }));

const RectangleModel = types.compose(
  "RectangleModel",
  ControlBase,
  TagAttrs,
  Model,
);

const HtxView = () => {
  return null;
};

Registry.addTag("rectangle", RectangleModel, HtxView);

export { HtxView, RectangleModel };

import { types, getRoot } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";
import { customTypes } from "../../core/CustomTypes";
import Types from "../../core/Types";

/**
 * Polygon is used to add polygons to an image without label selection. It's useful when you have only one label.
 * @example
 * <View>
 *   <Polygon name="rect-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name Polygon
 * @param {string} name                           - name of tag
 * @param {string} toname                         - name of image to label
 * @param {number} [opacity=0.6]                  - opacity of polygon
 * @param {string} [fillColor]                    - rectangle fill color, default is transparent
 * @param {string} [strokeColor]                  - stroke color
 * @param {number} [strokeWidth=1]                - width of stroke
 * @param {small|medium|large} [pointSize=medium] - size of polygon handle points
 * @param {rectangle|circle} [pointStyle=circle]  - style of points
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  opacity: types.optional(customTypes.range(), "0.6"),
  fillcolor: types.optional(customTypes.color, "#f48a42"),

  strokewidth: types.optional(types.string, "3"),
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
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    fromStateJSON() {},

    afterCreate() {
      const poly = Tools.Polygon.create();
      const floodFill = Tools.FloodFill.create();

      poly._control = self;
      floodFill._control = self;

      self.tools = {
        poly: poly,
        // floodfill: floodFill,
      };
    },
  }));

const PolygonModel = types.compose("PolygonModel", ControlBase, TagAttrs, Validation, Model);

const HtxView = () => null;

Registry.addTag("polygon", PolygonModel, HtxView);

export { HtxView, PolygonModel };

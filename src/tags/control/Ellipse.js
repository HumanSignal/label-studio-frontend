import { types, getRoot } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";

/**
 * Ellipse
 * Ellipse is used to add ellipse (elleptic Bounding Box) to an image
 * @example
 * <View>
 *   <Ellipse name="ellipse1-1" toName="img-1" />
 *   <Image name="img-1" value="$img" />
 * </View>
 * @name Ellipse
 * @param {string} name                  - name of the element
 * @param {string} toName                - name of the image to label
 * @param {float} [opacity=0.6]          - opacity of ellipse
 * @param {string} [fillColor]           - rectangle fill color, default is transparent
 * @param {string} [strokeColor=#f48a42] - stroke color
 * @param {number} [strokeWidth=1]       - width of the stroke
 * @param {boolean} [canRotate=true]     - show or hide rotation handle
 */
const TagAttrs = types.model({
  name: types.identifier,
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
    // id: types.identifier,
    type: "ellipse",
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    afterCreate() {
      const ellipse = Tools.Ellipse.create({ activeShape: null });
      ellipse._control = self;

      self.tools = { ellipse: ellipse };
    },
  }));

const EllipseModel = types.compose("EllipseModel", TagAttrs, Model, ControlBase);

const HtxView = () => {
  return null;
};

Registry.addTag("ellipse", EllipseModel, HtxView);

export { HtxView, EllipseModel };

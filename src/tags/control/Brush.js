import { types, getRoot } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";

const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
  strokewidth: types.optional(types.string, "15"),
});

const Model = types
  .model({
    type: "brush",
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },
  }))
  .actions(self => ({
    afterCreate() {
      const brush = Tools.Brush.create();
      const erase = Tools.Erase.create();
      // const zoom  = Tools.Zoom.create();

      brush._control = self;
      erase._control = self;

      self.tools = {
        brush: brush,
        erase: erase,
        // zoom: zoom
      };
    },
  }));

const BrushModel = types.compose("BrushModel", TagAttrs, Model, ControlBase, AnnotationMixin);

const HtxView = () => {
  return null;
};

Registry.addTag("brush", BrushModel, HtxView);

export { HtxView, BrushModel };

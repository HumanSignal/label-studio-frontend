import { types, getRoot } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";

const TagAttrs = types.model({
  name: types.maybeNull(types.string),
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

    get completion() {
      return getRoot(self).completionStore.selected;
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

const BrushModel = types.compose("BrushModel", TagAttrs, Model, ControlBase);

const HtxView = () => {
  return null;
};

Registry.addTag("brush", BrushModel, HtxView);

export { HtxView, BrushModel };

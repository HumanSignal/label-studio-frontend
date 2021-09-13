import { types } from "mobx-state-tree";

import * as Tools from "../../tools";
import Registry from "../../core/Registry";
import ControlBase from "./Base";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import SeparatedControlMixin from "../../mixins/SeparatedControlMixin";
import ToolsManager from "../../tools/Manager";

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
      const manager = ToolsManager.getInstance();
      const env = { manager, control: self };
      const brush = Tools.Brush.create({}, env);
      const erase = Tools.Erase.create({}, env);

      self.tools = {
        brush,
        erase,
      };
    },
  }));

const BrushModel = types.compose("BrushModel", ControlBase, AnnotationMixin, SeparatedControlMixin, TagAttrs, Model);

const HtxView = () => {
  return null;
};

Registry.addTag("brush", BrushModel, HtxView);

export { HtxView, BrushModel };

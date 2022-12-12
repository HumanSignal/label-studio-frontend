import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import ControlBase from "./Base";
import { customTypes } from "../../core/CustomTypes";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import SeparatedControlMixin from "../../mixins/SeparatedControlMixin";
import { ToolManagerMixin } from "../../mixins/ToolManagerMixin";

const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
  opacity: types.optional(customTypes.range(), "0.6"),
  blurradius: types.optional(types.string, "5"),
  defaultthreshold: types.optional(types.string, "15"),
});

const Model = types
  .model({
    type: "magicwand",
  })
  .views(self => ({
    get hasStates() {
      console.log("MagicWand tags/control.hasStates");
      const states = self.states();

      return states && states.length > 0;
    },
  }))
  .volatile(() => ({
    toolNames: ['MagicWand'],
  }));

const MagicWandModel = types.compose("MagicWandModel",
  ControlBase,
  AnnotationMixin,
  SeparatedControlMixin,
  TagAttrs,
  Model,
  ToolManagerMixin,
);

const HtxView = () => {
  return null;
};

Registry.addTag("magicwand", MagicWandModel, HtxView);

export { HtxView, MagicWandModel };
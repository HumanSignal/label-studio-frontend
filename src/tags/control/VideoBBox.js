import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
});

const ModelAttrs = types
  .model("VideoBBoxModel", {
    pid: types.optional(types.string, guidGenerator),
    type: "videobbox",
  });

const VideoBBoxModel = types.compose(
  "VideoBBoxModel",
  ModelAttrs,
  TagAttrs,
  ControlBase,
);

const HtxVideoBBox = observer(() => {
  return null;
});

Registry.addTag("videobbox", VideoBBoxModel, HtxVideoBBox);

export { HtxVideoBBox, VideoBBoxModel };

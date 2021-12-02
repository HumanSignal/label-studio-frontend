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
  .model("VideoRectangleModel", {
    pid: types.optional(types.string, guidGenerator),
    type: "videorectangle",
  });

const VideoRectangleModel = types.compose(
  "VideoRectangleModel",
  ModelAttrs,
  TagAttrs,
  ControlBase,
);

const HtxVideoRectangle = observer(() => {
  return null;
});

Registry.addTag("videorectangle", VideoRectangleModel, HtxVideoRectangle);

export { HtxVideoRectangle, VideoRectangleModel };

import { types } from "mobx-state-tree";

const BaseTool = types.model("BaseTool", {}).actions(self => ({}));

export const MIN_SIZE = { X: 3, Y: 3 };

export const DEFAULT_DIMENSIONS = {
  rect: { width: 30, height: 30 },
  ellipse: { radius: 30 },
  polygon: { length: 30 },
};

export default BaseTool;

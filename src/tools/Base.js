import { types } from "mobx-state-tree";

const BaseTool = types.model("BaseTool", {}).actions(self => ({}));

export const MIN_SIZE = { X: 3, Y: 3 };

export default BaseTool;

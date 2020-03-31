import { types } from "mobx-state-tree";

const BaseTool = types.model("BaseTool", {}).actions(self => ({}));

export default BaseTool;

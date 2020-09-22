import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";

const _Tool = types
  .model({
    default: types.optional(types.boolean, true),
  })
  .views(self => ({
    get tagTypes() {
      return {
        stateTypes: "keypointlabels",
        controlTagTypes: ["keypointlabels", "keypoint"],
      };
    },
  }))
  .actions(self => ({
    createRegion(opts) {
      const control = self.control;
      const labels = { [control.valueType]: control.selectedValues() };
      self.obj.completion.createResult(opts, labels, control, self.obj);
    },

    clickEv(ev, [x, y]) {
      const c = self.control;
      if (c.type === "keypointlabels" && !c.isSelected) return;

      if (!self.obj.checkLabels()) return;

      self.createRegion({
        x: x,
        y: y,
        width: Number(c.strokewidth),
        coordstype: "px",
      });

      self.obj.completion.unselectAll();
    },
  }));

const KeyPoint = types.compose(ToolMixin, BaseTool, _Tool);

// Registry.addTool("keypoint", KeyPoint);

export { KeyPoint };

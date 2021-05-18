import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { NodeViews } from "../components/Node/Node";

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
    get viewTooltip() {
      return "Key point region";
    },
    get iconComponent() {
      return NodeViews.KeyPointRegionModel[1];
    },
  }))
  .actions(self => ({
    createRegion(opts) {
      const control = self.control;
      const labels = { [control.valueType]: control.selectedValues?.() };
      self.obj.annotation.createResult(opts, labels, control, self.obj);
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
    },
  }));

const KeyPoint = types.compose(ToolMixin, BaseTool, _Tool);

// Registry.addTool("keypoint", KeyPoint);

export { KeyPoint };

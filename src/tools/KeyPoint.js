import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { NodeViews } from "../components/Node/Node";
import { DrawingTool } from "../mixins/DrawingTool";

const _Tool = types
  .model("KeyPointTool", {
    default: types.optional(types.boolean, true),
    group: "segmentation",
    shortcut: "K",
    smart: true,
  })
  .views(() => ({
    get tagTypes() {
      return {
        stateTypes: "keypointlabels",
        controlTagTypes: ["keypointlabels", "keypoint"],
      };
    },
    get viewTooltip() {
      return "Key Point";
    },
    get iconComponent() {
      return NodeViews.KeyPointRegionModel.icon;
    },
  }))
  .actions(self => ({
    clickEv(ev, [x, y]) {
      const c = self.control;

      if (c.type === "keypointlabels" && !c.isSelected) return;

      const keyPoint = self.createRegion({
        x,
        y,
        width: Number(c.strokewidth),
        coordstype: "px",
      });

      keyPoint.setDrawing(false);
    },
  }));

const KeyPoint = types.compose(_Tool.name, ToolMixin, BaseTool, DrawingTool, _Tool);

// Registry.addTool("keypoint", KeyPoint);

export { KeyPoint };

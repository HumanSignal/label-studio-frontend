import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { KeyPointRegionModel } from "../regions/KeyPointRegion";

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
      const c = self.control;

      const kp = KeyPointRegionModel.create({
        opacity: parseFloat(c.opacity),
        ...opts,
      });

      self.obj.completion.createRegion(opts, c, self.obj);

      return kp;
    },

    clickEv(ev, [x, y]) {
      const c = self.control;
      if (c.type === "keypointlabels" && !c.isSelected) return;

      if (!self.obj.checkLabels()) return;

      const sap = self.statesAndParams;

      self.createRegion({
        x: x,
        y: y,
        width: Number(c.strokewidth),
        coordstype: "px",
        ...sap,
      });

      self.obj.completion.unselectAll();
      // if (self.control.type === "keypointlabels") self.control.unselectAll();
    },
  }));

const KeyPoint = types.compose(ToolMixin, BaseTool, _Tool);

// Registry.addTool("keypoint", KeyPoint);

export { KeyPoint };

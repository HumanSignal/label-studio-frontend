import { types } from "mobx-state-tree";

import BaseTool, { MIN_SIZE } from "./Base";
import ToolMixin from "../mixins/Tool";
import { DrawingTool } from "../mixins/DrawingTool";

const _Tool = types
  .model({
    default: true,
    mode: types.optional(types.enumeration(["drawing", "viewing"]), "viewing"),
  })
  .views(self => ({
    get tagTypes() {
      return {
        stateTypes: "ellipselabels",
        controlTagTypes: ["ellipselabels", "ellipse"],
      };
    },
  }))
  .actions(self => ({
    createRegion(opts) {
      self.obj.completion.createResult(opts, self.control, self.obj);
    },

    mousedownEv(ev, [x, y]) {
      if (self.tagTypes.stateTypes === self.control.type && !self.control.isSelected) return;
      if (!self.obj.checkLabels()) return;

      self.mode = "drawing";

      self.createRegion({
        x: x,
        y: y,
        radiusX: 1,
        radiusY: 1,
        coordstype: "px",
      });

      if (self.tagTypes.stateTypes === self.control.type) self.completion.unselectAll();
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      self.updateDraw(x, y);
    },

    mouseupEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      const s = self.getActiveShape;

      if (s.radiusX < MIN_SIZE.X || s.radiusY < MIN_SIZE.Y) {
        self.completion.removeArea(s);
        if (self.control.type === "ellipselabels") self.completion.unselectAll();
      } else {
        // self.obj.completion.highlightedNode.unselectRegion(true);
      }

      self.mode = "viewing";
    },
  }));

const Ellipse = types.compose(ToolMixin, BaseTool, DrawingTool, _Tool);

export { Ellipse };

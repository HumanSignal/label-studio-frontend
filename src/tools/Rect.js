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
        stateTypes: "rectanglelabels",
        controlTagTypes: ["rectanglelabels", "rectangle"],
      };
    },
  }))
  .actions(self => ({
    createRegion(opts) {
      const control = self.control;
      const labels = { [control.valueType]: control.selectedValues?.() };
      self.obj.completion.createResult(opts, labels, control, self.obj);
    },

    mousedownEv(ev, [x, y]) {
      if (self.tagTypes.stateTypes === self.control.type && !self.control.isSelected) return;
      if (!self.obj.checkLabels()) return;

      self.completion.history.freeze();

      self.mode = "drawing";

      self.createRegion({
        x: x,
        y: y,
        height: 1,
        width: 1,
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

      if (s.width < MIN_SIZE.X || s.height < MIN_SIZE.Y) {
        self.completion.removeArea(s);
        if (self.control.type === "rectanglelabels") self.completion.unselectAll();
      } else {
        self.completion.history.unfreeze();
        // self.obj.completion.highlightedNode.unselectRegion(true);
      }

      self.mode = "viewing";
    },
  }));

const Rect = types.compose(ToolMixin, BaseTool, DrawingTool, _Tool);

export { Rect };

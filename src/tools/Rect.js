import { types } from "mobx-state-tree";

import BaseTool, { MIN_SIZE } from "./Base";
import ToolMixin from "../mixins/Tool";
import { DrawingTool } from "../mixins/DrawingTool";
import { AnnotationMixin } from "../mixins/AnnotationMixin";

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
      self.obj.annotation.createResult(opts, labels, control, self.obj);
    },

    mousedownEv(ev, [x, y]) {
      if (self.tagTypes.stateTypes === self.control.type && !self.control.isSelected) return;
      if (!self.obj.checkLabels()) return;

      self.annotation.history.freeze();

      self.mode = "drawing";

      self.createRegion({
        x: x,
        y: y,
        height: 1,
        width: 1,
        coordstype: "px",
      });
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      self.updateDraw(x, y);
    },

    mouseupEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      const s = self.getActiveShape;

      if (s.width < MIN_SIZE.X || s.height < MIN_SIZE.Y) {
        self.annotation.removeArea(s);
        if (self.control.type === "rectanglelabels") self.annotation.unselectAll(true);
      } else {
        self.annotation.history.unfreeze();
        // self.obj.annotation.highlightedNode.unselectRegion(true);
      }

      self.mode = "viewing";
    },
  }));

const Rect = types.compose(ToolMixin, BaseTool, DrawingTool, _Tool, AnnotationMixin);

export { Rect };

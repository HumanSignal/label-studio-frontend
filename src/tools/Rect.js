import { types, destroy } from "mobx-state-tree";

import BaseTool, { MIN_SIZE } from "./Base";
import ToolMixin from "../mixins/Tool";
import { RectRegionModel } from "../regions/RectRegion";
import { DrawingTool } from "../mixins/DrawingTool";
import { guidGenerator } from "../core/Helpers";
// import Area from "../regions/Area";
// import Region from "../regions/Region";
// import Registry from "../core/Registry";

// console.log('TYPES', Registry.objectTypes());

const _Tool = types
  .model({
    default: true,
    mode: types.optional(types.enumeration(["drawing", "viewing", "brush", "eraser"]), "viewing"),
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
      const c = self.control;
      const rect = RectRegionModel.create({
        opacity: parseFloat(c.opacity),
        strokeWidth: Number(c.strokewidth),
        fillOpacity: Number(c.fillopacity),
        ...opts,
      });

      console.log("COMP", self.obj.completion);
      self.obj.completion.createResult(opts, c, self.obj);

      // self.obj.addShape(rect);

      return rect;
    },

    mousedownEv(ev, [x, y]) {
      if (self.control.type === "rectanglelabels" && !self.control.isSelected) return;

      if (!self.obj.checkLabels()) return;

      self.mode = "drawing";

      const sap = self.statesAndParams;

      console.log("RECT PARAMS", sap);

      const rect = self.createRegion({
        x: x,
        y: y,
        height: 1,
        width: 1,
        coordstype: "px",
        ...sap,
      });

      if (self.control.type === "rectanglelabels") self.completion.unselectAll();

      return rect;
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
        // self.obj.completion.highlightedNode.unselectRegion(true);
      }

      self.mode = "viewing";
    },
  }));

const Rect = types.compose(ToolMixin, BaseTool, DrawingTool, _Tool);

export { Rect };

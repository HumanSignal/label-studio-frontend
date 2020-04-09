import { types, destroy } from "mobx-state-tree";

import Utils from "../utils";
import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { RectRegionModel } from "../regions/RectRegion";
import { guidGenerator, restoreNewsnapshot } from "../core/Helpers";

const minSize = { w: 3, h: 3 };

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

      self.obj.addShape(rect);

      return rect;
    },

    updateDraw(x, y) {
      const shape = self.getActiveShape;

      const { x1, y1, x2, y2 } = Utils.Image.reverseCoordinates({ x: shape.startX, y: shape.startY }, { x: x, y: y });

      shape.setPosition(x1, y1, x2 - x1, y2 - y1, shape.rotation);
    },

    mousedownEv(ev, [x, y]) {
      if (self.control.type === "rectanglelabels" && !self.control.isSelected) return;

      self.mode = "drawing";

      const sap = self.statesAndParams;

      const rect = self.createRegion({
        x: x,
        y: y,
        height: 1,
        width: 1,
        coordstype: "px",
        ...sap,
      });

      // if (self.control.type === "rectanglelabels") self.control.unselectAll();

      return rect;
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      self.updateDraw(x, y);
    },

    mouseupEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      const s = self.getActiveShape;

      if (s.width < minSize.w || s.height < minSize.h) {
        destroy(s);
        if (self.control.type === "rectanglelabels") self.control.unselectAll();
      } else {
        self.obj.completion().highlightedNode.unselectRegion();
      }

      self.mode = "viewing";
    },
  }));

const Rect = types.compose(ToolMixin, BaseTool, _Tool);

export { Rect };

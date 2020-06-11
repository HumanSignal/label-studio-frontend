import { types, destroy } from "mobx-state-tree";

import Utils from "../utils";
import BaseTool, { MIN_SIZE } from "./Base";
import ToolMixin from "../mixins/Tool";
import { RectRegionModel } from "../regions/RectRegion";
import { guidGenerator, restoreNewsnapshot } from "../core/Helpers";
import lodash from "../utils/lodash";

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

    updateDraw: lodash.throttle(function(x, y) {
      const shape = self.getActiveShape;

      const { x1, y1, x2, y2 } = Utils.Image.reverseCoordinates({ x: shape.startX, y: shape.startY }, { x: x, y: y });

      shape.setPosition(x1, y1, x2 - x1, y2 - y1, shape.rotation);
    }, 48), // 4 frames, optimized enough and not laggy yet

    mousedownEv(ev, [x, y]) {
      if (self.control.type === "rectanglelabels" && !self.control.isSelected) return;

      if (!self.obj.checkLabels()) return;

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

      if (s.width < MIN_SIZE.X || s.height < MIN_SIZE.Y) {
        destroy(s);
        if (self.control.type === "rectanglelabels") self.control.unselectAll();
      } else {
        self.obj.completion.highlightedNode.unselectRegion(true);
      }

      self.mode = "viewing";
    },
  }));

const Rect = types.compose(ToolMixin, BaseTool, _Tool);

export { Rect };

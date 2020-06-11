import { types, destroy } from "mobx-state-tree";

import Utils from "../utils";
import BaseTool, { MIN_SIZE } from "./Base";
import ToolMixin from "../mixins/Tool";
import { EllipseRegionModel } from "../regions/EllipseRegion";
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
        stateTypes: "ellipselabels",
        controlTagTypes: ["ellipselabels", "ellipse"],
      };
    },
  }))
  .actions(self => ({
    createRegion(opts) {
      const control = self.control;

      const ellipse = EllipseRegionModel.create({
        opacity: parseFloat(control.opacity),
        strokeWidth: Number(control.strokewidth),
        fillOpacity: Number(control.fillopacity),
        ...opts,
      });

      self.obj.addShape(ellipse);

      return ellipse;
    },

    updateDraw: lodash.throttle(function(x, y) {
      const shape = self.getActiveShape;

      const { x1, y1, x2, y2 } = Utils.Image.reverseCoordinates({ x: shape.startX, y: shape.startY }, { x: x, y: y });

      shape.setPosition(x1, y1, x2 - x1, y2 - y1, shape.rotation);
    }, 48), // 4 frames, optimized enough and not laggy yet

    mousedownEv(ev, [x, y]) {
      if (self.control.type === "ellipselabels" && !self.control.isSelected) return;

      if (!self.obj.checkLabels()) return;

      self.mode = "drawing";

      const sap = self.statesAndParams;
      const ellipse = self.createRegion({
        x: x,
        y: y,
        radiusX: 1,
        radiusY: 1,
        coordstype: "px",
        ...sap,
      });

      // if (self.control.type === "ellipselabels") self.control.unselectAll();

      return ellipse;
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      self.updateDraw(x, y);
    },

    mouseupEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      const s = self.getActiveShape;

      if (s.radiusX < MIN_SIZE.X || s.radiusY < MIN_SIZE.Y) {
        destroy(s);
        if (self.control.type === "ellipselabels") self.control.unselectAll();
      } else {
        self.obj.completion.highlightedNode.unselectRegion(true);
      }

      self.mode = "viewing";
    },
  }));

const Ellipse = types.compose(ToolMixin, BaseTool, _Tool);

export { Ellipse };

import { types, destroy } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { EllipseRegionModel } from "../regions/EllipseRegion";
import { guidGenerator, restoreNewsnapshot } from "../core/Helpers";

const minSize = { rx: 3, ry: 3 };

function reverseCoordinates(r1, r2) {
  let r1X = r1.x,
    r1Y = r1.y,
    r2X = r2.x,
    r2Y = r2.y,
    d;

  if (r1X > r2X) {
    d = Math.abs(r1X - r2X);
    r1X = r2X;
    r2X = r1X + d;
  }

  if (r1Y > r2Y) {
    d = Math.abs(r1Y - r2Y);
    r1Y = r2Y;
    r2Y = r1Y + d;
  }
  /**
   * Return the corrected rect
   */
  return { x1: r1X, y1: r1Y, x2: r2X, y2: r2Y };
}

const _Tool = types
  .model({
    default: true,
    mode: types.optional(types.enumeration(["drawing", "viewing", "brush", "eraser"]), "viewing"),
  })
  .views(self => ({}))
  .actions(self => ({
    fromStateJSON(obj, fromModel) {
      if ("ellipselabels" in obj.value) {
        const states = restoreNewsnapshot(fromModel);
        states.fromStateJSON(obj);
        self.createRegion({
          x: obj.value.x,
          y: obj.value.y,
          rx: obj.value.radiusX,
          ry: obj.value.radiusY,
          stroke: states.getSelectedColor(),
          states: [states],
          coordstype: "perc",
          rotation: obj.value.rotation,
        });
      }
    },

    createRegion({ x, y, rx, ry, states, coordstype, stroke, rotation }) {
      const control = self.control;

      let localStates = states;

      if (states && !states.length) {
        localStates = [states];
      }

      const ellipse = EllipseRegionModel.create({
        id: guidGenerator(),
        states: localStates,
        coordstype: coordstype,

        x: x,
        y: y,
        radiusX: rx,
        radiusY: ry,
        rotation: rotation,

        opacity: parseFloat(control.opacity),
        fillcolor: stroke || control.fillcolor,
        strokeWidth: control.strokeWidth,
        strokeColor: stroke || control.stroke,
      });

      self.obj.addShape(ellipse);

      return ellipse;
    },

    updateDraw(x, y) {
      const shape = self.getActiveShape;

      const { x1, y1, x2, y2 } = reverseCoordinates({ x: shape._start_x, y: shape._start_y }, { x: x, y: y });

      shape.setPosition(x1, y1, x2 - x1, y2 - y1, shape.rotation);
    },

    mousedownEv(ev, [x, y]) {
      if (self.control.type === "ellipselabels" && !self.control.isSelected) return;

      self.mode = "drawing";

      const { states, strokecolor } = self.statesAndParams;
      const ellipse = self.createRegion({
        x: x,
        y: y,
        rx: 1,
        ry: 1,
        stroke: strokecolor,
        states: states,
        coordstype: "px",
      });

      if (self.control.type === "ellipselabels") self.control.unselectAll();

      return ellipse;
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      self.updateDraw(x, y);
    },

    mouseupEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      const s = self.getActiveShape;

      if (s.width < minSize.w || s.height < minSize.h) destroy(s);

      self.mode = "viewing";
    },
  }));

const Ellipse = types.compose(ToolMixin, BaseTool, _Tool);

export { Ellipse };

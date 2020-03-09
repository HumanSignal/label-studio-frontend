import { types, destroy } from "mobx-state-tree";

import Utils from "../utils";
import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { EllipseRegionModel } from "../regions/EllipseRegion";
import { guidGenerator, restoreNewsnapshot } from "../core/Helpers";

const minSize = { rx: 3, ry: 3 };

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
          pid: obj.pid,
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

    createRegion({ pid, x, y, rx, ry, states, coordstype, stroke, rotation }) {
      const control = self.control;

      let localStates = states;

      if (states && !states.length) {
        localStates = [states];
      }

      const ellipse = EllipseRegionModel.create({
        id: guidGenerator(),
        pid: pid,
        states: localStates,
        coordstype: coordstype,

        x: x,
        y: y,
        radiusX: rx,
        radiusY: ry,
        rotation: rotation,

        opacity: parseFloat(control.opacity),
        fillcolor: stroke || control.fillcolor,
        strokeWidth: control.strokewidth,
        strokeColor: stroke || control.strokecolor,
      });

      self.obj.addShape(ellipse);

      return ellipse;
    },

    updateDraw(x, y) {
      const shape = self.getActiveShape;

      const { x1, y1, x2, y2 } = Utils.Image.reverseCoordinates({ x: shape.startX, y: shape.startY }, { x: x, y: y });

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

      if (s.radiusX < minSize.rx || s.radiusY < minSize.ry) {
        destroy(s);
        if (self.control.type === "ellipselabels") self.control.unselectAll();
      } else {
        self.obj.completion().highlightedNode.unselectRegion();
      }

      self.mode = "viewing";
    },
  }));

const Ellipse = types.compose(ToolMixin, BaseTool, _Tool);

export { Ellipse };

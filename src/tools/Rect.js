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
  .views(self => ({}))
  .actions(self => ({
    fromStateJSON(obj, fromModel) {
      let states = null;
      let scolor = self.control.strokecolor;

      if (obj.type === "rectanglelabels") {
        states = restoreNewsnapshot(fromModel);
        if (states.fromStateJSON) {
          states.fromStateJSON(obj);
          scolor = states.getSelectedColor();
        }

        states = [states];
      }

      if (obj.type === "rectanglelabels" || obj.type === "rectangle") {
        self.createRegion({
          pid: obj.id,
          x: obj.value.x,
          y: obj.value.y,
          sw: obj.value.width,
          sh: obj.value.height,
          stroke: scolor,
          states: states,
          coordstype: "perc",
          rotation: obj.value.rotation,
        });
      }
    },

    createRegion({ pid, x, y, sw, sh, states, coordstype, stroke, rotation }) {
      const control = self.control;

      let localStates = states;

      if (states && !Array.isArray(states)) {
        localStates = [states];
      }

      const rect = RectRegionModel.create({
        id: guidGenerator(),
        pid: pid,
        states: localStates,
        coordstype: coordstype,

        x: x,
        y: y,
        width: sw,
        height: sh,
        rotation: rotation,

        opacity: parseFloat(control.opacity),
        fillcolor: stroke || control.fillcolor,
        strokeWidth: Number(control.strokewidth),
        fillOpacity: Number(control.fillopacity),
        strokeColor: stroke || control.strokecolor,
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

      const { states, strokecolor } = self.statesAndParams;
      const rect = self.createRegion({
        x: x,
        y: y,
        sh: 1,
        sw: 1,
        stroke: strokecolor,
        states: states,
        coordstype: "px",
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

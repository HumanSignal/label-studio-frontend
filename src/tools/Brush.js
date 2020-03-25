import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { HighlightOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import SliderTool from "../components/Tools/Slider";
import ToolMixin from "../mixins/Tool";
import { BrushRegionModel } from "../regions/BrushRegion";
import { guidGenerator, restoreNewsnapshot } from "../core/Helpers";
import Canvas from "../utils/canvas";

const ToolView = observer(({ item }) => {
  return (
    <SliderTool
      selected={item.selected}
      icon={<HighlightOutlined />}
      onClick={ev => {
        const sel = item.selected;
        item.manager.unselectAll();

        item.setSelected(!sel);

        if (item.selected) {
          item.updateCursor();
        }
      }}
      onChange={val => {
        item.setStroke(val);
        item.updateCursor();
      }}
    />
  );
});

const _Tool = types
  .model({
    strokeWidth: types.optional(types.number, 10),
  })
  .views(self => ({
    get viewClass() {
      return <ToolView item={self} />;
    },
  }))
  .actions(self => ({
    fromStateJSON(obj, fromModel) {
      if ("brushlabels" in obj.value) {
        const states = restoreNewsnapshot(fromModel);
        states.fromStateJSON(obj);

        const region = self.createRegion({
          pid: obj.id,
          stroke: states.getSelectedColor(),
          states: states,
          // coordstype: "px",
          // points: obj.value.points,
        });

        if (obj.value.points) {
          const p = region.addPoints({ type: "add" });
          p.addPoints(obj.value.points);
        }

        if (obj.value.format === "rle") {
          region._rle = obj.value.rle;
        }
      }
    },

    createRegion({ pid, stroke, states, coordstype, mode, points }) {
      const c = self.control;

      let localStates = states;

      if (states && !states.length) {
        localStates = [states];
      }

      const brush = BrushRegionModel.create({
        id: guidGenerator(),
        pid: pid,

        strokeWidth: self.strokeWidth || Number(c.strokewidth),
        strokeColor: stroke,

        states: localStates,

        // points: points,
        // eraserpoints: eraserpoints,

        coordstype: coordstype,

        mode: mode,
      });

      self.obj.addShape(brush);

      return brush;
    },

    updateCursor() {
      const val = self.strokeWidth;
      const stage = self.obj.stageRef;
      const base64 = Canvas.brushSizeCircle(val);
      const cursor = ["url('", base64, "')", " ", Math.floor(val / 2) + 4, " ", Math.floor(val / 2) + 4, ", auto"];

      stage.container().style.cursor = cursor.join("");
    },

    setStroke(val) {
      self.strokeWidth = val;
    },

    mouseupEv() {
      self.mode = "viewing";
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      const shape = self.getSelectedShape;

      shape.currentTouch.addPoints(Math.floor(x), Math.floor(y));
    },

    mousedownEv(ev, [x, y]) {
      const c = self.control;
      const brush = self.getSelectedShape;

      if (brush) {
        self.mode = "drawing";

        const p = brush.addTouch({
          type: "add",
          strokeWidth: self.strokeWidth || c.strokeWidth,
        });

        p.addPoints(Math.floor(x), Math.floor(y));
      } else {
        if (c.isSelected) {
          self.mode = "drawing";

          const { states, strokecolor } = self.statesAndParams;

          const brush = self.createRegion({
            x: x,
            y: y,
            stroke: strokecolor,
            states: states,
            coordstype: "px",
          });

          const p = brush.addTouch({
            type: "add",
            strokeWidth: self.strokeWidth || c.strokeWidth,
          });

          p.addPoints(Math.floor(x), Math.floor(y));
        }
      }
    },
  }));

const Brush = types.compose(ToolMixin, BaseTool, _Tool);

export { Brush };

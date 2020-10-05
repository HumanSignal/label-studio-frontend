import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { HighlightOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import SliderTool from "../components/Tools/Slider";
import ToolMixin from "../mixins/Tool";
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

    get tagTypes() {
      return {
        stateTypes: "brushlabels",
        controlTagTypes: ["brushlabels", "brush"],
      };
    },
  }))
  .actions(self => ({
    fromStateJSON(json, controlTag) {
      const region = self.createFromJSON(json, controlTag);

      if (json.value.points) {
        const p = region.addPoints({ type: "add" });
        p.addPoints(json.value.points);
      }

      if (json.value.format === "rle") {
        region._rle = json.value.rle;
      }

      return region;
    },

    // fromStateJSON(obj, fromModel) {
    //   if ("brushlabels" in obj.value) {
    //     const states = restoreNewsnapshot(fromModel);
    //     states.fromStateJSON(obj);

    //     const region = self.createRegion({
    //       pid: obj.id,
    //       stroke: states.getSelectedColor(),
    //       states: states,
    //       // coordstype: "px",
    //       // points: obj.value.points,
    //     });

    //     if (obj.value.points) {
    //       const p = region.addPoints({ type: "add" });
    //       p.addPoints(obj.value.points);
    //     }

    //     if (obj.value.format === "rle") {
    //       region._rle = obj.value.rle;
    //     }
    //   }
    // },

    createRegion(opts) {
      const control = self.control;
      const labels = { [control.valueType]: control.selectedValues?.() };
      return self.obj.completion.createResult(opts, labels, control, self.obj);
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

          const brush = self.createRegion({
            touches: [],
            coordstype: "px",
          });

          self.obj.completion.selectArea(brush);

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

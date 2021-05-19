import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { HighlightOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import SliderTool from "../components/Tools/Slider";
import ToolMixin from "../mixins/Tool";
import Canvas from "../utils/canvas";
import { findClosestParent } from "../utils/utilities";

const ToolView = observer(({ item }) => {
  return (
    <SliderTool
      selected={item.selected}
      icon={<HighlightOutlined />}
      onClick={ev => {
        const sel = item.selected;
        item.manager.unselectAll();

        item.setSelected(!sel);
      }}
      onChange={val => {
        item.setStroke(val);
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
  .actions(self => {
    let brush;
    return {
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
        return self.obj.annotation.createResult(opts, labels, control, self.obj);
      },

      updateCursor() {
        if (!self.selected) return;
        const val = self.strokeWidth;
        const stage = self.obj.stageRef;
        const base64 = Canvas.brushSizeCircle(val);
        const cursor = ["url('", base64, "')", " ", Math.floor(val / 2) + 4, " ", Math.floor(val / 2) + 4, ", auto"];

        stage.container().style.cursor = cursor.join("");
      },

      setStroke(val) {
        self.strokeWidth = val;
        self.updateCursor();
      },

      afterUpdateSelected() {
        self.updateCursor();
      },

      addPoint(x, y) {
        brush.addPoint(Math.floor(x), Math.floor(y));
      },

      mouseupEv() {
        if (self.mode !== "drawing") return;
        self.mode = "viewing";
        brush.endPath();
        self.obj.annotation.selectArea(brush);
      },

      mousemoveEv(ev, [x, y]) {
        if (self.mode !== "drawing") return;
        if (
          !findClosestParent(
            ev.target,
            el => el === self.obj.stageRef.content,
            el => el.parentElement,
          )
        )
          return;

        self.addPoint(x, y);
      },

      mousedownEv(ev, [x, y]) {
        if (
          !findClosestParent(
            ev.target,
            el => el === self.obj.stageRef.content,
            el => el.parentElement,
          )
        )
          return;
        const c = self.control;
        brush = self.getSelectedShape;
        if (brush && brush.type === "brushregion") {
          self.mode = "drawing";

          brush.beginPath({
            type: "add",
            strokeWidth: self.strokeWidth || c.strokeWidth,
          });

          self.addPoint(x, y);
        } else {
          if (c.isSelected) {
            self.mode = "drawing";

            brush = self.createRegion({
              touches: [],
              coordstype: "px",
            });

            brush.beginPath({
              type: "add",
              strokeWidth: self.strokeWidth || c.strokeWidth,
            });

            self.addPoint(x, y);
          }
        }
      },
    };
  });

const Brush = types.compose(ToolMixin, BaseTool, _Tool);

export { Brush };

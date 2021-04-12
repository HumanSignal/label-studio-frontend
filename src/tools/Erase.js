import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { ScissorOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import BasicTool from "../components/Tools/Basic";
import ToolMixin from "../mixins/Tool";
import Canvas from "../utils/canvas";
import { clamp } from "../utils/utilities";

const ToolView = observer(({ item }) => {
  return (
    <BasicTool
      selected={item.selected}
      onClick={ev => {
        const sel = item.selected;

        item.manager.unselectAll();

        item.setSelected(!sel);

        if (item.selected) {
          item.updateCursor();
        }
      }}
      icon={<ScissorOutlined />}
    />
  );
});

const _Tool = types
  .model({})
  .views(self => ({
    get viewClass() {
      return <ToolView item={self} />;
    },
  }))
  .actions(self => {
    let touchPoints;
    return {
      updateCursor() {
        const val = 24;
        const stage = self.obj.stageRef;
        const base64 = Canvas.brushSizeCircle(val);
        const cursor = ["url('", base64, "')", " ", Math.floor(val / 2) + 4, " ", Math.floor(val / 2) + 4, ", auto"];

        stage.container().style.cursor = cursor.join("");
      },

      addTouchPoint(x, y) {
        const { stageWidth, stageHeight } = self.obj;
        touchPoints.addPoints(clamp(Math.floor(x), 0, stageWidth), clamp(Math.floor(y), 0, stageHeight));
      },

      mouseupEv() {
        self.mode = "viewing";
      },

      mousemoveEv(ev, [x, y]) {
        if (self.mode !== "drawing") return;

        const shape = self.getSelectedShape;
        if (shape && shape.type === "brushregion") {
          self.addTouchPoint(x, y);
        }
      },

      mousedownEv(ev, [x, y]) {
        self.mode = "drawing";

        const shape = self.getSelectedShape;
        if (!shape) return;

        if (shape && shape.type === "brushregion") {
          touchPoints = shape.addTouch({ type: "eraser" });
          self.addTouchPoint(x, y);
        }
      },
    };
  });

const Erase = types.compose(ToolMixin, _Tool, BaseTool);

export { Erase };

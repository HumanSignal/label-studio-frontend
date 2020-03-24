import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { ScissorOutlined } from "@ant-design/icons";

import Hotkey from "../core/Hotkey";
import BaseTool from "./Base";
import BasicTool from "../components/Tools/Basic";
import ToolMixin from "../mixins/Tool";
import Canvas from "../utils/canvas";

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
  .actions(self => ({
    updateCursor() {
      const val = 24;
      const stage = self.obj.stageRef;
      const base64 = Canvas.brushSizeCircle(val);
      const cursor = ["url('", base64, "')", " ", Math.floor(val / 2) + 4, " ", Math.floor(val / 2) + 4, ", auto"];

      stage.container().style.cursor = cursor.join("");
    },

    mouseupEv() {
      self.mode = "viewing";
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "drawing") return;

      const shape = self.getSelectedShape;
      if (shape && shape.type === "brushregion") {
        shape.currentTouch.addPoints(Math.floor(x), Math.floor(y));
      }
    },

    mousedownEv(ev, [x, y]) {
      self.mode = "drawing";

      const shape = self.getSelectedShape;
      if (!shape) return;

      if (shape && shape.type === "brushregion") {
        shape.addTouch({ type: "eraser" });
      }
    },
  }));

const Erase = types.compose(ToolMixin, _Tool, BaseTool);

export { Erase };

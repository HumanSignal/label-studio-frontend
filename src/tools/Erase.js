import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { ScissorOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import BasicTool from "../components/Tools/Basic";
import ToolMixin from "../mixins/Tool";
import Canvas from "../utils/canvas";
import { findClosestParent } from "../utils/utilities";

const ToolView = observer(({ item }) => {
  return (
    <BasicTool
      selected={item.selected}
      onClick={ev => {
        const sel = item.selected;

        item.manager.unselectAll();

        item.setSelected(!sel);
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
    let brush;
    return {
      updateCursor() {
        if (!self.selected) return;
        const val = 24;
        const stage = self.obj.stageRef;
        const base64 = Canvas.brushSizeCircle(val);
        const cursor = ["url('", base64, "')", " ", Math.floor(val / 2) + 4, " ", Math.floor(val / 2) + 4, ", auto"];

        stage.container().style.cursor = cursor.join("");
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

        const shape = self.getSelectedShape;
        if (shape && shape.type === "brushregion") {
          self.addPoint(x, y);
        }
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

        brush = self.getSelectedShape;
        if (!brush) return;

        if (brush && brush.type === "brushregion") {
          self.mode = "drawing";
          brush.beginPath({ type: "eraser", opacity: 1 });
          self.addPoint(x, y);
        }
      },
    };
  });

const Erase = types.compose(ToolMixin, _Tool, BaseTool);

export { Erase };

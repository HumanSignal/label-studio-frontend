import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import Canvas from "../utils/canvas";
import { findClosestParent } from "../utils/utilities";
import { DrawingTool } from "../mixins/DrawingTool";
import { Tool } from "../components/Toolbar/Tool";
import { Range } from "../common/Range/Range";
import { NodeViews } from "../components/Node/Node";

const IconDot = ({ size }) => {
  return (
    <span style={{
      display: 'block',
      width: size,
      height: size,
      background: 'rgba(0, 0, 0, 0.25)',
      borderRadius: '100%',
    }}/>
  );
};

const ToolView = observer(({ item }) => {
  return (
    <Tool
      label="Brush"
      ariaLabel="brush-tool"
      active={item.selected}
      shortcut={item.shortcut}
      extraShortcuts={item.extraShortcuts}
      icon={item.iconClass}
      tool={item}
      onClick={() => {
        if (item.selected) return;

        item.manager.selectTool(item, true);
      }}
      controls={item.controls}
    />
  );
});

const _Tool = types
  .model("BrushTool", {
    strokeWidth: types.optional(types.number, 10),
    group: "segmentation",
    shortcut: "B",
    smart: true,
  })
  .views(self => ({
    get viewClass() {
      return () => <ToolView item={self} />;
    },
    get iconComponent() {
      return self.dynamic
        ? NodeViews.BrushRegionModel.altIcon
        : NodeViews.BrushRegionModel.icon;
    },
    get tagTypes() {
      return {
        stateTypes: "brushlabels",
        controlTagTypes: ["brushlabels", "brush"],
      };
    },
    get controls() {
      return [
        <Range
          key="brush-size"
          value={self.strokeWidth}
          min={10}
          max={50}
          reverse
          align="vertical"
          minIcon={<IconDot size={8}/>}
          maxIcon={<IconDot size={16}/>}
          onChange={(value) => {
            self.setStroke(value);
          }}
        />,
      ];
    },
    get extraShortcuts() {
      return {
        "[": ["Decrease size", () => {
          self.setStroke(Math.max(10, self.strokeWidth - 5));
        }],
        "]": ["Increase size", () => {
          self.setStroke(Math.min(50, self.strokeWidth + 5));
        }],
      };
    },
  }))
  .actions(self => {
    let brush, isFirstBrushStroke;

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

      commitDrawingRegion() {
        const { currentArea, control, obj } = self;
        const source = currentArea.toJSON();

        const value = { coordstype: "px", touches: source.touches, dynamic: source.dynamic };
        const newArea = self.annotation.createResult(value, currentArea.results[0].value.toJSON(), control, obj);

        self.applyActiveStates(newArea);
        self.deleteRegion();
        return newArea;
      },

      updateCursor() {
        if (!self.selected || !self.obj.stageRef) return;
        const val = self.strokeWidth;
        const stage = self.obj.stageRef;
        const base64 = Canvas.brushSizeCircle(val);
        const cursor = ["url('", base64, "')", " ", Math.floor(val / 2) + 4, " ", Math.floor(val / 2) + 4, ", auto"];

        stage.container().style.cursor = cursor.join("");
      },

      setStroke(val) {
        self.strokeWidth = val;
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
        brush.setDrawing(false);
        brush.endPath();
        if (isFirstBrushStroke) {
          const newBrush = self.commitDrawingRegion();

          self.obj.annotation.selectArea(newBrush);
        }
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

        // Reset the timer if a user started drawing again
        brush = self.getSelectedShape;
        if (brush && brush.type === "brushregion") {
          self.mode = "drawing";
          brush.setDrawing(true);
          isFirstBrushStroke = false;
          brush.beginPath({
            type: "add",
            strokeWidth: self.strokeWidth || c.strokeWidth,
          });

          self.addPoint(x, y);
        } else {
          if (self.tagTypes.stateTypes === self.control.type && !self.control.isSelected) return;
          self.mode = "drawing";
          isFirstBrushStroke = true;
          brush = self.createDrawingRegion({
            touches: [],
            coordstype: "px",
          });

          brush.beginPath({
            type: "add",
            strokeWidth: self.strokeWidth || c.strokeWidth,
          });

          self.addPoint(x, y);
        }
      },
    };
  });

const Brush = types.compose(_Tool.name, ToolMixin, BaseTool, DrawingTool, _Tool);

export { Brush };

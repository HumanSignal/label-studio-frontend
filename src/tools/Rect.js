import { types } from "mobx-state-tree";

import BaseTool, { DEFAULT_DIMENSIONS } from "./Base";
import ToolMixin from "../mixins/Tool";
import { ThreePointsDrawingTool, TwoPointsDrawingTool } from "../mixins/DrawingTool";
import { AnnotationMixin } from "../mixins/AnnotationMixin";
import { NodeViews } from "../components/Node/Node";
import { FF_DEV_2132, isFF } from "../utils/feature-flags";

const _Tool = types
  .model("RectangleTool", {
    group: "segmentation",
    smart: true,
    shortcut: "R",
  })
  .views(self => {
    const Super = {
      createRegionOptions: self.createRegionOptions,
      isIncorrectControl: self.isIncorrectControl,
      isIncorrectLabel: self.isIncorrectLabel,
    };

    return {

      get getActivePolygon() {
        const poly = self.currentArea;

        if (poly && poly.closed) return null;
        if (poly === undefined) return null;
        if (poly && poly.type !== "rectangleregion") return null;

        return poly;
      },

      get tagTypes() {
        return {
          stateTypes: "rectanglelabels",
          controlTagTypes: ["rectanglelabels", "rectangle"],
        };
      },
      get viewTooltip() {
        return "Rectangle";
      },
      get iconComponent() {
        return self.dynamic
          ? NodeViews.RectRegionModel.altIcon
          : NodeViews.RectRegionModel.icon;
      },
      get defaultDimensions() {
        return DEFAULT_DIMENSIONS.rect;
      },
      createRegionOptions({ x, y }) {
        return Super.createRegionOptions({
          x,
          y,
          height: 1,
          width: 1,
        });
      },

      isIncorrectControl() {
        return Super.isIncorrectControl() && self.current() === null;
      },
      isIncorrectLabel() {
        return !self.current() && Super.isIncorrectLabel();
      },
      canStart() {
        return self.current() === null;
      },

      current() {
        return self.getActivePolygon;
      },
    };
  })
  .actions(self => ({
    beforeCommitDrawing() {
      const s = self.getActiveShape;

      return s.width > self.MIN_SIZE.X  && s.height * self.MIN_SIZE.Y;
    },
  }));

const RectDrawingTool = isFF(FF_DEV_2132) ? ThreePointsDrawingTool : TwoPointsDrawingTool;

const Rect = types.compose(_Tool.name, ToolMixin, BaseTool, RectDrawingTool, _Tool, AnnotationMixin);

export { Rect };

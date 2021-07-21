import { types } from "mobx-state-tree";

import BaseTool, { DEFAULT_DIMENSIONS, MIN_SIZE } from "./Base";
import ToolMixin from "../mixins/Tool";
import { TwoPointsDrawingTool } from "../mixins/DrawingTool";
import { AnnotationMixin } from "../mixins/AnnotationMixin";
import { NodeViews } from "../components/Node/Node";

const _Tool = types
  .model("RectTool")
  .views(self => {
    const Super = {
      createRegionOptions: self.createRegionOptions,
    };
    return {
      get tagTypes() {
        return {
          stateTypes: "rectanglelabels",
          controlTagTypes: ["rectanglelabels", "rectangle"],
        };
      },
      get viewTooltip() {
        return "Rectangle region";
      },
      get iconComponent() {
        return NodeViews.RectRegionModel[1];
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
    };
  })
  .actions(self => ({
    beforeCommitDrawing() {
      const s = self.getActiveShape;
      return s.width > self.MIN_SIZE.X  && s.height * self.MIN_SIZE.Y;
    },
  }));

const Rect = types.compose(ToolMixin, BaseTool, TwoPointsDrawingTool, _Tool, AnnotationMixin);

export { Rect };

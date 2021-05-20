import { types } from "mobx-state-tree";

import BaseTool, { DEFAULT_DIMENSIONS, MIN_SIZE } from "./Base";
import ToolMixin from "../mixins/Tool";
import { TwoPointsDrawingTool } from "../mixins/DrawingTool";
import { AnnotationMixin } from "../mixins/AnnotationMixin";

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
      return s.width > MIN_SIZE.X && s.height > MIN_SIZE.Y;
    },
  }));

const Rect = types.compose(ToolMixin, BaseTool, TwoPointsDrawingTool, _Tool, AnnotationMixin);

export { Rect };

import { types } from "mobx-state-tree";

import BaseTool, { DEFAULT_DIMENSIONS } from "./Base";
import ToolMixin from "../mixins/Tool";
import { MultipleClicksDrawingTool } from "../mixins/DrawingTool";
import { NodeViews } from "../components/Node/Node";

const _Tool = types
  .model("PolygonTool")
  .views(self => {
    const Super = {
      createRegionOptions: self.createRegionOptions,
      isIncorrectControl: self.isIncorrectControl,
      isIncorrectLabel: self.isIncorrectLabel,
    };
    return {
      get getActivePolygon() {
        const poly = self.getActiveShape;

        if (poly && poly.closed) return null;
        if (poly === undefined) return null;
        if (poly.type !== "polygonregion") return null;

        return poly;
      },

      get tagTypes() {
        return {
          stateTypes: "polygonlabels",
          controlTagTypes: ["polygonlabels", "polygon"],
        };
      },

      get viewTooltip() {
        return "Polygon region";
      },
      get iconComponent() {
        return NodeViews.PolygonRegionModel[1];
      },

      get defaultDimensions() {
        return DEFAULT_DIMENSIONS.polygon;
      },

      moreRegionParams(obj) {
        return {
          x: obj.value.points[0][0],
          y: obj.value.points[0][1],
        };
      },

      createRegionOptions({ x, y }) {
        return Super.createRegionOptions({
          points: [[x, y]],
          width: 10,
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
    closeCurrent() {
      self.getCurrentArea().closePoly();
    },
  }));

const Polygon = types.compose(ToolMixin, BaseTool, MultipleClicksDrawingTool, _Tool);

export { Polygon };

// ImageTools.addTool(PolygonTool);

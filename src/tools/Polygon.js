import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { PolygonRegionModel } from "../regions/PolygonRegion";

const _Tool = types
  .model({
    default: types.optional(types.boolean, true),
    mode: types.optional(types.enumeration(["drawing", "viewing", "brush", "eraser"]), "viewing"),
  })
  .views(self => ({
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

    moreRegionParams(obj) {
      return {
        x: obj.value.points[0][0],
        y: obj.value.points[0][1],
      };
    },
  }))
  .actions(self => ({
    fromStateJSON(obj, controlTag) {
      const poly = self.createFromJSON(obj, controlTag);
      if (poly) {
        for (var i = 1; i < obj.value.points.length; i++) {
          poly.addPoint(obj.value.points[i][0], obj.value.points[i][1]);
        }

        poly.closePoly();
      }
    },

    createRegion(opts) {
      const c = self.control;
      const current = self.getActivePolygon;

      if (current) {
        current.addPoint(...opts.points[0]);
      } else {
        self.obj.completion.createResult(opts, c, self.obj);
      }
    },

    clickEv(ev, [x, y]) {
      if (self.control.type === "polygonlabels") if (!self.control.isSelected && self.getActivePolygon === null) return;

      if (!self.getActivePolygon && !self.obj.checkLabels()) return;

      const sap = self.statesAndParams;

      // if there is a polygon in process of creation right now, but
      // the user has clicked on the labels without first finishing
      // it, we close it automatically and create a new one with new
      // labels

      // if (states.length && self.getActivePolygon) {
      //   self.getActivePolygon.closePoly();
      // }

      self.createRegion({
        points: [[x, y]],
        width: 10,
        coordstype: "px",
        ...sap,
      });

      // self.obj.completion.unselectAll();
      // if (self.control.type == "polygonlabels") self.control.unselectAll();
    },
  }));

const Polygon = types.compose(ToolMixin, BaseTool, _Tool);

export { Polygon };

// ImageTools.addTool(PolygonTool);

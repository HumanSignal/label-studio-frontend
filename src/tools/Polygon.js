import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { PolygonRegionModel } from "../regions/PolygonRegion";
import { restoreNewsnapshot } from "../core/Helpers";

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
      let newPolygon = self.getActivePolygon;
      // self.freezeHistory();
      const image = self.obj;
      const c = self.control;

      delete opts["points"];

      if (!newPolygon) {
        newPolygon = PolygonRegionModel.create({
          opacity: Number(c.opacity),
          strokeWidth: Number(c.strokewidth),
          fillOpacity: Number(c.fillopacity),
          pointSize: c.pointsize,
          pointStyle: c.pointstyle,
          ...opts,
        });

        image.addShape(newPolygon);
      }

      newPolygon.addPoint(opts.x, opts.y);

      return newPolygon;
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
        x: x,
        y: y,
        width: 10,
        coordstype: "px",
        ...sap,
      });

      // if (self.control.type == "polygonlabels") self.control.unselectAll();
    },
  }));

const Polygon = types.compose(ToolMixin, BaseTool, _Tool);

export { Polygon };

// ImageTools.addTool(PolygonTool);

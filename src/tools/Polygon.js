import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";

const _Tool = types
  .model({
    default: types.optional(types.boolean, true),
    mode: types.optional(types.enumeration(["drawing", "viewing"]), "viewing"),
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
    clickEv(ev, [x, y]) {
      const control = self.control;
      const current = self.getActivePolygon;
      const withStates = self.tagTypes.stateTypes === control.type;

      if (withStates && !control.isSelected && current === null) return;

      if (!current && !self.obj.checkLabels()) return;

      // if there is a polygon in process of creation right now, but
      // the user has clicked on the labels without first finishing
      // it, we close it automatically and create a new one with new
      // labels

      // if (states.length && self.getActivePolygon) {
      //   self.getActivePolygon.closePoly();
      // }

      if (current) {
        current.addPoint(x, y);
      } else {
        const opts = {
          points: [[x, y]],
          width: 10,
          coordstype: "px",
        };

        self.obj.completion.history.freeze();
        self.obj.completion.createResult(opts, control, self.obj);
        if (withStates) self.obj.completion.unselectAll();
      }
    },
  }));

const Polygon = types.compose(ToolMixin, BaseTool, _Tool);

export { Polygon };

// ImageTools.addTool(PolygonTool);

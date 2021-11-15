import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import SliderTool from "../components/Tools/Slider";
import ToolMixin from "../mixins/Tool";
import { PolygonRegionModel } from "../regions/PolygonRegion";
import { calcBorder, getImageData } from "../utils/floodfill";
import { guidGenerator } from "../core/Helpers";

const DEF_THRESHOLD = 10;

const ToolView = observer(({ item }) => {
  return (
    <SliderTool
      max={50}
      default={DEF_THRESHOLD}
      selected={item.selected}
      icon={"tool"}
      onClick={() => {
        const sel = item.selected;

        item.manager.selectTool(item, !sel);
      }}
      onChange={val => {
        item.setThreshold(val);
      }}
    />
  );
});

const _Tool = types
  .model("FloodFillTool", {
    threshold: types.optional(types.number, DEF_THRESHOLD),
    group: "segmentation",
  })
  .views(self => ({
    get viewClass() {
      return () => <ToolView item={self} />;
    },
  }))
  .actions(self => ({
    setThreshold(val) {
      self.threshold = val;
    },

    mouseupEv() {
      self.mode = "viewing";
    },

    mousemoveEv() {
      if (self.mode !== "drawing") return;
    },

    createPolygonRegion(points) {
      const { states, strokecolor } = {};
      const c = self.control;

      const p = PolygonRegionModel.create({
        id: guidGenerator(),

        opacity: parseFloat(c.opacity),
        fillcolor: c.fillcolor,

        strokewidth: parseInt(c.strokewidth),
        strokecolor,

        pointsize: c.pointsize,
        pointstyle: c.pointstyle,

        states,

        coordstype: "px",
      });

      points.forEach(t => p.addPoint(t.x, t.y));
      self.obj.addShape(p);

      p.closePoly();

      return p;
    },

    clickEv(ev, [x, y]) {
      const image = self.obj;
      const imageRef = image.imageRef;
      const imageData = getImageData(imageRef);
      const points = calcBorder(imageData.data, image.naturalWidth, image.naturalHeight, x, y, self.threshold, true);

      if (points) self.createPolygonRegion(points);

      self.control.unselectAll();
    },

    mousedownEv() {
      self.mode = "drawing";
    },
  }));

const FloodFill = types.compose(_Tool.name, ToolMixin, _Tool, BaseTool);

export { FloodFill };

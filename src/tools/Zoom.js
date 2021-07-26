import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { DragOutlined, ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import BasicToolView from "../components/Tools/Basic";
import ToolMixin from "../mixins/Tool";

const ToolView = observer(({ item }) => {
  return (
    <Fragment>
      <BasicToolView
        selected={item.selected}
        icon={<DragOutlined />}
        tooltip="Move position"
        onClick={ev => {
          const sel = item.selected;
          item.manager.selectTool(item, !sel);
        }}
      />
      <BasicToolView
        icon={<ZoomInOutlined />}
        tooltip="Zoom into the image"
        onClick={ev => {
          item.handleZoom(1);
        }}
      />
      <BasicToolView
        icon={<ZoomOutOutlined />}
        tooltip="Zoom out of the image"
        onClick={ev => {
          item.handleZoom(-1);
        }}
      />
    </Fragment>
  );
});

const _Tool = types
  .model({
    // image: types.late(() => types.safeReference(Registry.getModelByTag("image")))
  })
  .views(self => ({
    get viewClass() {
      return <ToolView item={self} />;
    },
  }))
  .actions(self => ({
    mouseupEv() {
      self.mode = "viewing";
    },

    updateCursor() {
      if (!self.selected || !self.obj.stageRef) return;
      const stage = self.obj.stageRef;
      stage.container().style.cursor = "all-scroll";
    },

    afterUpdateSelected() {
      self.updateCursor();
    },

    handleDrag(ev) {
      const item = self._manager.obj;
      let posx = item.zoomingPositionX + ev.movementX;
      let posy = item.zoomingPositionY + ev.movementY;
      item.setZoomPosition(posx, posy);
    },

    mousemoveEv(ev, [x, y]) {
      const zoomScale = self._manager.obj.zoomScale;

      if (zoomScale <= 1) return;
      if (self.mode === "moving") self.handleDrag(ev);
    },

    mousedownEv(ev, [x, y]) {
      self.mode = "moving";
    },

    handleZoom(val) {
      const item = self._manager.obj;
      item.handleZoom(val);
    },
  }));

const Zoom = types.compose(ToolMixin, BaseTool, _Tool);

// Registry.addTool("zoom", Zoom);

export { Zoom };

// ImageTools.addTool(ZoomTool);

import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { Tool } from "../components/Toolbar/Tool";
import { IconMagnifyTool, IconMinifyTool, IconMoveTool } from "../assets/icons";

const ToolView = observer(({ item }) => {
  return (
    <Fragment>
      <Tool
        active={item.selected}
        icon={<IconMoveTool />}
        label="Pan Image"
        shortcut="M"
        onClick={() => {
          const sel = item.selected;

          item.manager.selectTool(item, !sel);
        }}
      />
      <Tool
        icon={<IconMagnifyTool />}
        label="Zoom into the image"
        shortcut="alt+plus"
        onClick={() => {
          item.handleZoom(1);
        }}
      />
      <Tool
        icon={<IconMinifyTool />}
        label="Zoom out of the image"
        shortcut="alt+minus"
        onClick={() => {
          item.handleZoom(-1);
        }}
      />
    </Fragment>
  );
});

const _Tool = types
  .model({
    // image: types.late(() => types.safeReference(Registry.getModelByTag("image")))
    group: "control",
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

    mousemoveEv(ev) {
      const zoomScale = self._manager.obj.zoomScale;

      if (zoomScale <= 1) return;
      if (self.mode === "moving") self.handleDrag(ev);
    },

    mousedownEv() {
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

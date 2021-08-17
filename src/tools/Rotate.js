import React from "react";

import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { Tool } from "../components/Toolbar/Tool";
import { IconRotateLeftTool, IconRotateRightTool } from "../assets/icons";

const ToolView = observer(({ item }) => {
  return (
    <>
      <Tool
        active={item.selected}
        icon={<IconRotateLeftTool />}
        label="Rotate Left"
        onClick={() => {
          item.rotate(-90);
        }}
      />
      <Tool
        active={item.selected}
        icon={<IconRotateRightTool />}
        label="Rotate Right"
        onClick={() => {
          item.rotate(90);
        }}
      />
    </>
  );
});

const _Tool = types
  .model({})
  .views(self => ({
    get viewClass() {
      return <ToolView item={self} />;
    },
  }))
  .actions(self => ({
    rotate(degree) {
      self.obj.rotate(degree);
    },
  }));

const Rotate = types.compose(ToolMixin, BaseTool, _Tool);

export { Rotate };

// ImageTools.addTool(RotateTool);

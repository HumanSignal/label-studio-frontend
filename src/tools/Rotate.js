import React from "react";

import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { RotateLeftOutlined, RotateRightOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import BasicToolView from "../components/Tools/Basic";

const ToolView = observer(({ item }) => {
  return (
    <>
      <BasicToolView
        selected={item.selected}
        icon={<RotateLeftOutlined />}
        tooltip="Rotate Left"
        onClick={() => {
          item.rotate(-90);
        }}
      />
      <BasicToolView
        selected={item.selected}
        icon={<RotateRightOutlined />}
        tooltip="Rotate Right"
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

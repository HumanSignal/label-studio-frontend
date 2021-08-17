import { types } from "mobx-state-tree";
import { observer } from "mobx-react";
import React from "react";
import { Tool } from "../components/Toolbar/Tool";

const ToolView = observer(({ item }) => {
  return (
    <Tool
      active={item.selected}
      icon={item.iconClass}
      label={item.viewTooltip}
      onClick={() => {
        item.manager.selectTool(item, !item.selected);
      }}
    />
  );
});

const BaseTool = types
  .model("BaseTool", {})
  .views(self => {
    return {
      get isSeparated() {
        return self.control.isSeparated;
      },
      get viewClass() {
        return self.isSeparated && self.iconClass ? <ToolView item={self} /> : null;
      },
      get viewTooltip() {
        return null;
      },
      get iconClass() {
        if (self.iconComponent) {
          const Icon = self.iconComponent;

          return <Icon />;
        }
        return null;
      },
      get iconComponent() {
        return null;
      },
    };
  })
  .actions(() => ({}));

export const MIN_SIZE = { X: 3, Y: 3 };

export const DEFAULT_DIMENSIONS = {
  rect: { width: 30, height: 30 },
  ellipse: { radius: 30 },
  polygon: { length: 30 },
};

export default BaseTool;

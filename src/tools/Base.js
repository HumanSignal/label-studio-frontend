import { types } from "mobx-state-tree";
import { observer } from "mobx-react";
import React from "react";
import BasicToolView from "../components/Tools/Basic";

const ToolView = observer(({ item }) => {
  return (
    <BasicToolView
      selected={item.selected}
      icon={item.iconClass}
      tooltip={item.viewTooltip}
      onClick={ev => {
        item.manager.selectTool(item, !item.selected);
      }}
    />
  );
});

const BaseTool = types
  .model("BaseTool", {})
  .views(self => {
    return {
      get viewClass() {
        return self.iconClass ? <ToolView item={self} /> : null;
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
  .actions(self => ({}));

export const MIN_SIZE = { X: 3, Y: 3 };

export default BaseTool;

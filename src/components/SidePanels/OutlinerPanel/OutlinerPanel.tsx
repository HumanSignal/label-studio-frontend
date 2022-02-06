import { observer } from "mobx-react";
import { FC, useCallback, useState } from "react";
import { PanelBase, PanelProps } from "../PanelBase";
import { OutlinerTree } from "./OutlinerTree";
import { GroupingOptions, OrderingOptions, ViewControls } from "./ViewControls";

interface OutlinerPanelProps extends PanelProps {
  regions: any;
}

const OutlinerPanelComponent: FC<OutlinerPanelProps> = ({ regions, ...props }) => {
  const onOrderingChange = useCallback((value) => {
    console.log("onOrderingChange", { value });
    regions.setSort(value);
  }, []);

  const onGroupingChange = useCallback((value) => {
    console.log("onGroupingChange", { value });
    regions.setGrouping(value);
  }, []);

  return (
    <PanelBase {...props} name="outliner" title="Outliner">
      <ViewControls
        grouping={regions.group}
        ordering={regions.sort}
        orderingDirection={regions.sortOrder}
        onOrderingChange={onOrderingChange}
        onGroupingChange={onGroupingChange}
      />
      <OutlinerTree
        regions={regions}
        selectedKeys={regions.selection.keys}
      />
    </PanelBase>
  );
};

export const OutlinerPanel = observer(OutlinerPanelComponent);

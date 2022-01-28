import { observer } from "mobx-react";
import { FC, useState } from "react";
import { PanelBase, PanelProps } from "../PanelBase";
import { OutlinerTree } from "./OutlinerTree";
import { GroupingOptions, OrderingOptions, ViewControls } from "./ViewControls";

interface OutlinerPanelProps extends PanelProps {
  regions: any;
}

const OutlinerPanelComponent: FC<OutlinerPanelProps> = ({ regions, ...props }) => {
  const [grouping, setGrouping] = useState<GroupingOptions | null>(null);
  const [ordering, setOrdering] = useState<OrderingOptions | null>(null);

  return (
    <PanelBase {...props} name="outliner" title="Outliner">
      <ViewControls
        grouping={grouping}
        ordering={ordering}
        onOrderingChange={value => setOrdering(value)}
        onGroupingChange={value => setGrouping(value)}
      />
      <OutlinerTree
        regions={regions}
        grouping={grouping}
        ordering={ordering}
        selectedKeys={regions.selection.keys}
      />
    </PanelBase>
  );
};

export const OutlinerPanel = observer(OutlinerPanelComponent);

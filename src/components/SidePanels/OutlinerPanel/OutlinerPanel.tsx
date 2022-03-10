import { observer } from "mobx-react";
import { FC, useCallback } from "react";
import { Elem } from "../../../utils/bem";
import { PanelBase, PanelProps } from "../PanelBase";
import { OutlinerTree } from "./OutlinerTree";
import { ViewControls } from "./ViewControls";
import "./OutlinerPanel.styl";

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
      {regions?.regions?.length > 0 ? (
        <OutlinerTree
          regions={regions}
          selectedKeys={regions.selection.keys}
        />
      ) : (
        <Elem name="empty">
          Regions not added
        </Elem>
      )}
    </PanelBase>
  );
};

export const OutlinerPanel = observer(OutlinerPanelComponent);

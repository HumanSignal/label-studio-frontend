import { FC, useCallback, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { DetailsPanel } from "./DetailsPanel/DetailsPanel";
import { OutlinerPanel } from "./OutlinerPanel/OutlinerPanel";
import { observer } from "mobx-react";

import "./SidePanels.styl";

interface SidePanelsProps {
  panelsHidden: boolean;
  store: any;
  currentEntity: any;
  regions: any;
}

const SidePanelsComponent: FC<SidePanelsProps> = ({
  store,
  currentEntity,
  regions,
  panelsHidden,
  children,
}) => {
  const [panelSizes, setPanelSizes] = useState({
    outliner: 320,
    details: 320,
  });

  const [panelsVisibility, setPanelsVisibility] = useState({
    outliner: true,
    details: true,
  });

  const onPanelResize = useCallback((name: string, size: number) => {
    setPanelSizes({
      ...panelSizes,
      [name]: size,
    });
  }, [panelSizes]);

  const onPanelVisibilityChange = useCallback((name: string, visible: boolean) => {
    setPanelsVisibility({
      ...panelsVisibility,
      [name]: visible,
    });
  }, [panelSizes]);

  return (
    <Block name="sidepanels" style={{
      paddingLeft: panelSizes.outliner,
      paddingRight: panelSizes.details,
    }}>
      <Elem name="content">
        {children}
      </Elem>
      {panelsHidden !== true && (
        <>
          <OutlinerPanel
            width={panelSizes.outliner}
            visible={panelsVisibility.outliner}
            onResize={onPanelResize}
            position="left"
            onVisibilityChange={onPanelVisibilityChange}
            regions={regions}
            currentEntity={currentEntity}
          />
          <DetailsPanel
            width={panelSizes.details}
            visible={panelsVisibility.details}
            onResize={onPanelResize}
            position="right"
            onVisibilityChange={onPanelVisibilityChange}
            currentEntity={currentEntity}
          />
        </>
      )}
    </Block>
  );
};

export const SidePanels = observer(SidePanelsComponent);

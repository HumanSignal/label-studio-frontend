import { FC, useCallback, useMemo, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { DetailsPanel } from "./DetailsPanel/DetailsPanel";
import { OutlinerPanel } from "./OutlinerPanel/OutlinerPanel";
import { observer } from "mobx-react";

import "./SidePanels.styl";
import { IconDetails, IconHamburger } from "../../assets/icons";

interface SidePanelsProps {
  panelsHidden: boolean;
  store: any;
  currentEntity: any;
  regions: any;
}

export type PanelType = "outliner" | "details";

type PanelSize = Record<PanelType, number>

type PanelVisibility = Record<PanelType, boolean>

const SidePanelsComponent: FC<SidePanelsProps> = ({
  currentEntity,
  regions,
  panelsHidden,
  children,
}) => {
  const [panelSizes, setPanelSizes] = useState<PanelSize>({
    outliner: 320,
    details: 320,
  });

  const [panelsVisibility, setPanelsVisibility] = useState<PanelVisibility>({
    outliner: true,
    details: true,
  });

  const onPanelResize = useCallback((name: PanelType, size: number) => {
    setPanelSizes({
      ...panelSizes,
      [name]: size,
    });
  }, [panelSizes]);

  const onPanelVisibilityChange = useCallback((name: PanelType, visible: boolean) => {
    setPanelsVisibility({
      ...panelsVisibility,
      [name]: visible,
    });
  }, [panelSizes]);

  const padding = useMemo(() => {
    return Object.entries(panelsVisibility).reduce<PanelSize>((res, [key, visible]) => {
      return { ...res, [key]: (visible && panelsHidden !== true) ? panelSizes[key as PanelType] : 0 };
    }, panelSizes);
  }, [
    panelsHidden,
    panelSizes,
    panelsVisibility,
  ]);

  return (
    <Block name="sidepanels" style={{
      paddingLeft: padding.outliner,
      paddingRight: padding.details,
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
            icon={<IconHamburger/>}
          />
          <DetailsPanel
            width={panelSizes.details}
            visible={panelsVisibility.details}
            onResize={onPanelResize}
            position="right"
            onVisibilityChange={onPanelVisibilityChange}
            regions={regions}
            selection={regions.selection}
            currentEntity={currentEntity}
            icon={<IconDetails/>}
          />
        </>
      )}
    </Block>
  );
};

export const SidePanels = observer(SidePanelsComponent);

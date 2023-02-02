import { useRegionOrder } from '@atoms/Models/RegionsAtom/Hooks/useRegionOrder';
import { useRegions } from '@atoms/Models/RegionsAtom/Hooks/useRegions';
import { useRegionsController } from '@atoms/Models/RegionsAtom/Hooks/useRegionsController';
import { FC, useMemo } from 'react';
import { Elem } from '../../../utils/bem';
import { PanelBase, PanelProps } from '../PanelBase';
import './OutlinerPanel.styl';
import { OutlinerTree } from './OutlinerTree';
import { ViewControls } from './ViewControls';

export const OutlinerPanel: FC<PanelProps> = (props) => {
  const regions = useRegions(props.annotationAtom);
  const resultController = useRegionsController(props.annotationAtom);
  const regionsOrder = useRegionOrder(props.annotationAtom);

  const selectedRegions = useMemo(() => {
    if (props.selection.length === 0) return [];

    return props.selection.map(reg => reg.toString());
  }, [props.selection]);

  return (
    <PanelBase {...props} name="outliner" title="Outliner">
      <ViewControls
        grouping={regionsOrder.group}
        ordering={regionsOrder.orderBy}
        orderingDirection={regionsOrder.order}
        onOrderingChange={resultController.setOrderBy}
        onGroupingChange={resultController.setGroup}
      />
      {regions?.length > 0 ? (
        <OutlinerTree
          regions={regions}
          group={regionsOrder.group}
          annotationAtom={props.annotationAtom}
          selectedKeys={selectedRegions}
        />
      ) : (
        <Elem name="empty">
          Regions not added
        </Elem>
      )}
    </PanelBase>
  );
};

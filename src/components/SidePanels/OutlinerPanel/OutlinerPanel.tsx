import { useRegionsOrder } from '@atoms/Models/RegionsAtom/Hooks';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import { Elem } from '../../../utils/bem';
import { PanelBase, PanelProps } from '../PanelBase';
import './OutlinerPanel.styl';
import { OutlinerTree } from './OutlinerTree';
import { ViewControls } from './ViewControls';

export const OutlinerPanel: FC<PanelProps> = (props) => {
  const regionsOrder = useRegionsOrder(props.regions);

  const {
    regions: regionsData,
    selection,
  } = useAtomValue(props.regions);

  return (
    <PanelBase {...props} name="outliner" title="Outliner">
      <ViewControls
        grouping={regionsOrder.group}
        ordering={regionsOrder.orderBy}
        orderingDirection={regionsOrder.order}
        onOrderingChange={regionsOrder.setOrderBy}
        onGroupingChange={regionsOrder.setGroup}
      />
      {regionsData?.length > 0 ? (
        <OutlinerTree
          regions={regionsData}
          group={regionsOrder.group}
          selectedKeys={Array.from(selection)}
        />
      ) : (
        <Elem name="empty">
          Regions not added
        </Elem>
      )}
    </PanelBase>
  );
};

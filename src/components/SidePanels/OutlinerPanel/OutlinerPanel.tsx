import { useAnnotationRegions } from '@atoms/Models/AnnotationsAtom/Hooks/useAnnotationRegions';
import { useRegionsOrder } from '@atoms/Models/ResultAtom/Hooks/useRegionsOrder';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import { Elem } from '../../../utils/bem';
import { PanelBase, PanelProps } from '../PanelBase';
import './OutlinerPanel.styl';
import { OutlinerTree } from './OutlinerTree';
import { ViewControls } from './ViewControls';

export const OutlinerPanel: FC<PanelProps> = (props) => {
  const regions = useAnnotationRegions(props.annotationAtom);
  const regionsOrder = useRegionsOrder(regions.resultAtom);

  const { selection } = useAtomValue(regions.resultAtom);
  const regionsData = useAtomValue(regions.resultListAtom);

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
          annotationAtom={props.annotationAtom}
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

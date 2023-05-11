import { observer } from 'mobx-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Block, Elem } from '../../../utils/bem';
import { PanelBase, PanelProps } from '../PanelBase';
import { OutlinerTree } from './OutlinerTree';
import { ViewControls } from './ViewControls';
import './OutlinerPanel.styl';
import { IconInfo } from '../../../assets/icons/outliner';

interface OutlinerPanelProps extends PanelProps {
  regions: any;
}

const OutlinerPanelComponent: FC<OutlinerPanelProps> = ({ regions, ...props }) => {
  const [group, setGroup] = useState();
  const onOrderingChange = useCallback((value) => {
    regions.setSort(value);
  }, [regions]);

  const onGroupingChange = useCallback((value) => {
    regions.setGrouping(value);
    setGroup(value);
  }, [regions]);

  const onFilterChange = useCallback((value) => {
    regions.setFilteredRegions(value);
  }, [regions]);

  useEffect(() => {
    setGroup(regions.group);
  }, []);

  regions.setGrouping(group);

  return (
    <PanelBase {...props} name="outliner" title="Outliner">
      <ViewControls
        grouping={regions.group}
        ordering={regions.sort}
        regions={regions}
        orderingDirection={regions.sortOrder}
        onOrderingChange={onOrderingChange}
        onGroupingChange={onGroupingChange}
        onFilterChange={onFilterChange}
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

const OutlinerStandAlone: FC<OutlinerPanelProps> = ({ regions }) => {
  const onOrderingChange = useCallback((value) => {
    regions.setSort(value);
  }, [regions]);

  const onGroupingChange = useCallback((value) => {
    regions.setGrouping(value);
  }, [regions]);

  const onFilterChange = useCallback((value) => {
    regions.setFilteredRegions(value);
  }, [regions]);

  const hiddenRegions = useMemo(() => {
    return (regions?.regions?.length ?? 0) - (regions?.filter?.length ?? 0);
  }, [regions?.regions?.length, regions?.filter?.length]);

  return (
    <Block name="outliner">
      <ViewControls
        grouping={regions.group}
        ordering={regions.sort}
        regions={regions}
        orderingDirection={regions.sortOrder}
        onOrderingChange={onOrderingChange}
        onGroupingChange={onGroupingChange}
        onFilterChange={onFilterChange}
      />
      {regions?.regions?.length > 0 ? (
        <>
          <OutlinerTree
            regions={regions}
            selectedKeys={regions.selection.keys}
          />
          {hiddenRegions > 0 && (
            <Elem name="filters-empty">
              <IconInfo width={21} height={20} />
              <Elem name="filters-title">There {hiddenRegions === 1 ? 'is' : 'are'} {hiddenRegions} hidden region{hiddenRegions > 1 && 's'}</Elem>
              <Elem name="filters-description">Adjust or remove filters to view</Elem>
            </Elem>
          )}
        </>
      ) : (
        <Elem name="empty">
          Regions not added
        </Elem>
      )}
    </Block>
  );
};

export const OutlinerComponent = observer(OutlinerStandAlone);

export const OutlinerPanel = observer(OutlinerPanelComponent);

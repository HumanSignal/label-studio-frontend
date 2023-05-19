import { FC, useCallback, useContext, useMemo } from 'react';
import { IconCursor, IconDetails, IconList, IconSortDown, IconSortUp, IconSpeed, IconTagAlt } from '../../../assets/icons';
import { Button } from '../../../common/Button/Button';
import { Dropdown } from '../../../common/Dropdown/Dropdown';
// eslint-disable-next-line
// @ts-ignore
import { Menu } from '../../../common/Menu/Menu';
import { BemWithSpecifiContext } from '../../../utils/bem';
import { SidePanelsContext } from '../SidePanelsContext';
import './ViewControls.styl';
import { Filter } from '../../Filter/Filter';
import { FF_DEV_3873, FF_LSDV_3025, isFF } from '../../../utils/feature-flags';
import { observer } from 'mobx-react';

const { Block, Elem } = BemWithSpecifiContext();

export type GroupingOptions = 'manual' | 'label' | 'type';

export type OrderingOptions = 'score' | 'date'

export type OrderingDirection = 'asc' | 'desc'

interface ViewControlsProps {
  grouping: GroupingOptions;
  ordering: OrderingOptions;
  orderingDirection?: OrderingDirection;
  regions: any;
  onOrderingChange: (ordering: OrderingOptions) => void;
  onGroupingChange: (grouping: GroupingOptions) => void;
  onFilterChange: (filter: any) => void;
}

export const ViewControls: FC<ViewControlsProps> = observer(({
  grouping,
  ordering,
  regions,
  orderingDirection,
  onOrderingChange,
  onGroupingChange,
  onFilterChange,
}) => {
  const context = useContext(SidePanelsContext);
  const getGroupingLabels = useCallback((value: GroupingOptions): LabelInfo => {
    switch(value) {
      case 'manual': return {
        label: 'Group Manually',
        selectedLabel: isFF(FF_DEV_3873) ? 'Manual': 'Manual Grouping',
        icon: <IconList/>,
      };
      case 'label': return {
        label: 'Group by Label',
        selectedLabel:  isFF(FF_DEV_3873) ? 'Label': 'Grouped by Label',
        icon: <IconTagAlt/>,
      };
      case 'type': return {
        label: 'Group by Tool',
        selectedLabel:  isFF(FF_DEV_3873) ? 'Tool': 'Grouped by Tool',
        icon: <IconCursor/>,
      };
    }
  }, []);

  const getOrderingLabels = useCallback((value: OrderingOptions): LabelInfo => {
    switch(value) {
      case 'date': return {
        label: 'Order by Time',
        selectedLabel: 'By Time',
        icon: <IconDetails/>,
      };
      case 'score': return {
        label: 'Order by Score',
        selectedLabel: 'By Score',
        icon: <IconSpeed/>,
      };
    }
  }, []);

  return (
    <Block name="view-controls" mod={{ collapsed: context.locked }}>
      <Grouping
        value={grouping}
        options={['manual', 'type', 'label']}
        onChange={value => onGroupingChange(value)}
        readableValueForKey={getGroupingLabels}
      />
      {grouping === 'manual' && (
        <Elem name="sort">
          <Grouping
            value={ordering}
            direction={orderingDirection}
            options={['score', 'date']}
            onChange={value => onOrderingChange(value)}
            readableValueForKey={getOrderingLabels}
            allowClickSelected
          />
          {isFF(FF_DEV_3873) && (
            <Button
              type="text"
              icon={
                orderingDirection === 'asc' ? (
                  <IconSortUp style={{ color: '#898098' }} />
                ) : (
                  <IconSortDown style={{ color: '#898098' }} />
                )
              }
              style={{ padding: 0, whiteSpace: 'nowrap' }}
              onClick={() => onOrderingChange(ordering)}
            />
          )}
        </Elem>
      )}
      {isFF(FF_LSDV_3025) && (
        <Filter
          onChange={onFilterChange}
          filterData={regions?.regions}
          availableFilters={[
            {
              label: 'Annotation results',
              path: 'labelName',
              type: 'String',
            },
            {
              label: 'Confidence score',
              path: 'score',
              type: 'Number',
            },
          ]}
        />
      )}
    </Block>
  );
});

interface LabelInfo {
  label: string;
  selectedLabel: string;
  icon: JSX.Element;
}

interface GroupingProps<T extends string> {
  value: T;
  options: T[];
  direction?: OrderingDirection;
  allowClickSelected?: boolean;
  onChange: (value: T) => void;
  readableValueForKey: (value: T) => LabelInfo;
}

const Grouping = <T extends string>({
  value,
  options,
  direction,
  allowClickSelected,
  onChange,
  readableValueForKey,
}: GroupingProps<T>) => {

  const readableValue = useMemo(() => {
    return readableValueForKey(value);
  }, [value]);

  const optionsList: [T, LabelInfo][] = useMemo(() => {
    return options.map((key) => [key, readableValueForKey(key)]);
  }, []);

  const dropdownContent = useMemo(() => {
    return (
      <Menu
        size="medium"
        style={{ width: 200, minWidth: 200 }}
        selectedKeys={[value]}
        allowClickSelected={allowClickSelected}
      >
        {optionsList.map(([key, label]) => (
          <GroupingMenuItem
            key={key}
            name={key}
            value={value}
            direction={direction}
            label={label}
            onChange={(value) => onChange(value)}
          />
        ))}
      </Menu>
    );
  }, [value, optionsList, readableValue, direction]);

  return (
    <Dropdown.Trigger content={dropdownContent} style={{ width: 200 }}>
      <Button type="text" icon={readableValue.icon} style={{ padding: 0, whiteSpace: 'nowrap' }} extra={(
        <DirectionIndicator
          direction={direction}
          name={value}
          value={value}
          wrap={false}
        />
      )}>
        {readableValue.selectedLabel}
      </Button>
    </Dropdown.Trigger>
  );
};

interface GroupingMenuItemProps<T extends string> {
  name: T;
  label: LabelInfo;
  value: T;
  direction?: OrderingDirection;
  onChange: (key: T) => void;
}

const GroupingMenuItem = <T extends string>({
  value,
  name,
  label,
  direction,
  onChange,
}: GroupingMenuItemProps<T>) => {
  return (
    <Menu.Item
      name={name}
      onClick={() => onChange(name)}
    >
      <Elem name="label">
        {label.label}
        <DirectionIndicator
          direction={direction}
          name={name}
          value={value}
        />
      </Elem>
    </Menu.Item>
  );
};

interface DirectionIndicator {
  direction?: OrderingDirection;
  value: string;
  name: string;
  wrap?: boolean;
}

const DirectionIndicator: FC<DirectionIndicator> = ({
  direction,
  value,
  name,
  wrap = true,
}) => {
  const content = direction === 'asc' ? <IconSortUp/> : <IconSortDown/>;

  if (!direction || value !== name || isFF(FF_DEV_3873)) return null;
  if (!wrap) return content;

  return (<span>{content}</span>);
};

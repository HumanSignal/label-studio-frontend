import { FC, useCallback, useMemo } from "react";
import { IconCursor, IconDetails, IconList, IconSortDown, IconSortUp, IconSpeed, IconTagAlt } from "../../../assets/icons";
import { Button } from "../../../common/Button/Button";
import { Dropdown } from "../../../common/Dropdown/Dropdown.js";
import { Menu } from "../../../common/Menu/Menu.js";
import { BemWithSpecifiContext } from "../../../utils/bem";
import { colors } from "../../../utils/namedColors";
import "./ViewControls.styl";

const { Block, Elem } = BemWithSpecifiContext();

export type GroupingOptions = "manual" | "label" | "type";

export type OrderingOptions = "score" | "date"

export type OrderingDirection = "asc" | "desc"

interface ViewControlsProps {
  grouping: GroupingOptions;
  ordering: OrderingOptions;
  orderingDirection?: OrderingDirection;
  onOrderingChange: (ordering: OrderingOptions) => void;
  onGroupingChange: (grouping: GroupingOptions) => void;
}

export const ViewControls: FC<ViewControlsProps> = ({
  grouping,
  ordering,
  orderingDirection,
  onOrderingChange,
  onGroupingChange,
}) => {
  const getGrouppingLabels = useCallback((value: GroupingOptions): LabelInfo => {
    switch(value) {
      case "manual": return {
        label: "Group Manually",
        selectedLabel: "Manual Grouping",
        icon: <IconList/>,
      };
      case "label": return {
        label: "Group by Label",
        selectedLabel: "Grouped by Label",
        icon: <IconTagAlt/>,
      };
      case "type": return {
        label: "Group by Tool",
        selectedLabel: "Grouped by Tool",
        icon: <IconCursor/>,
      };
    }
  }, []);

  const getOrderingLabels = useCallback((value: OrderingOptions): LabelInfo => {
    switch(value) {
      case "date": return {
        label: "Order by Time",
        selectedLabel: "Ordered by Time",
        icon: <IconDetails/>,
      };
      case "score": return {
        label: "Order by Score",
        selectedLabel: "Ordered by Score",
        icon: <IconSpeed/>,
      };
    }
  }, []);

  return (
    <Block name="view-controls">
      <Grouping
        value={grouping}
        options={["manual", "type", "label"]}
        onChange={value => onGroupingChange(value)}
        readableValueForKey={getGrouppingLabels}
      />
      <Grouping
        value={ordering}
        direction={orderingDirection}
        options={["score", "date"]}
        onChange={value => onOrderingChange(value)}
        readableValueForKey={getOrderingLabels}
        allowClickSelected
      />
    </Block>
  );
};

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

  if (!direction || value !== name) return null;
  if (!wrap) return content;

  return (<span>{content}</span>);
};

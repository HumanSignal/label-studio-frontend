import { FC, useMemo } from "react";
import { Block, Elem } from "../../../utils/bem";
import { Dropdown } from "../../../common/Dropdown/Dropdown.js";
import { Menu } from "../../../common/Menu/Menu.js";
import "./ViewControls.styl";
import { Button } from "../../../common/Button/Button";

export type GroupingOptions = "tool" | "label" | "manual";

export type OrderingOptions = "score"

interface ViewControlsProps {
  grouping: GroupingOptions | null;
  ordering: OrderingOptions | null;
  onOrderingChange: (ordering: OrderingOptions | null) => void;
  onGroupingChange: (grouping: GroupingOptions | null) => void;
}

export const ViewControls: FC<ViewControlsProps> = ({
  grouping,
  ordering,
  onOrderingChange,
  onGroupingChange,
}) => {
  return (
    <Block name="view-controls">
      <Grouping
        value={grouping}
        options={["tool", "label", "manual"] as GroupingOptions[]}
        onChange={value => onGroupingChange(value)}
        readableValueForKey={(value: any) => {
          switch(value) {
            case null: return "Plain Regions";
            case "label": return "Grouped by Label";
            case "tool": return "Grouped by Tool";
            case "manual": return "Manual Grouping";
          }
          return "Unknown value";
        }}
      />
      <Grouping
        value={ordering}
        options={["score"] as OrderingOptions[] }
        onChange={value => onOrderingChange(value)}
        readableValueForKey={(value: any) => {
          switch(value) {
            case null: return "Ordered by Time";
            case "score": return "Ordered by Score";
          }
          return "Unknown value";
        }}
      />
    </Block>
  );
};

interface GroupingProps<T extends string> {
  value: T | null;
  options: T[];
  onChange: (value: T | null) => void;
  readableValueForKey: (value: T | null) => string;
}

const Grouping = <T extends string>({
  value,
  onChange,
  options,
  readableValueForKey,
}: GroupingProps<T>) => {

  const readableValue = useMemo(() => {
    return readableValueForKey(value);
  }, [value]);

  const optionsList: [T, string][] = useMemo(() => {
    return options.map((key) => [key, readableValueForKey(key)]);
  }, []);

  return (
    <Dropdown.Trigger
      content={(
        <Menu size="medium" selectedKeys={[value]}>
          <Menu.Item
            name={null}
            onClick={() => onChange(null)}
          >
            {readableValueForKey(null)}
          </Menu.Item>

          {optionsList.map(([key, label]) => {
            return (
              <Menu.Item
                key={key}
                name={key}
                onClick={() => onChange(key)}
              >
                {label}
              </Menu.Item>
            );
          })}
        </Menu>
      )}
    >
      <Button type="text" style={{
        fontSize: 14,
        height: 24,
        width: 135,
        fontWeight: 400,
      }}>
        <Elem name="icon"/>
        {readableValue}
      </Button>
    </Dropdown.Trigger>
  );
};

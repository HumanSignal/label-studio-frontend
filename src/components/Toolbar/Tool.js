import { Block, Elem } from "../../utils/bem";
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { isDefined } from "../../utils/utilities";
import { useMemo } from "react";
import { Fragment } from "react";

export const Tool = ({
  active = false,
  disabled = false,
  expanded = false,
  icon,
  label,
  shortcut,
  onClick,
}) => {
  const shortcutView = useMemo(() => {
    if (!isDefined(shortcut)) return null;

    const combos = shortcut.split(",").map(s => s.trim());

    return (
      <Elem name="shortcut">
        {combos.map((combo, index) => {
          return (
            <Fragment key={`${combo.join('-')}-${index}`}>
              {combo.map(key => <kbd key={key}>{key}</kbd>)}
            </Fragment>
          );
        })}
      </Elem>
    );
  }, [shortcut]);

  return (
    <Tooltip title={label} enabled={isDefined(label) && !expanded}>
      <Block name="tool" mod={{ active, disabled }} onClick={onClick}>
        {icon}
        {expanded && (<Elem name="label">{label} {shortcutView}</Elem>)}
      </Block>
    </Tooltip>
  );
};

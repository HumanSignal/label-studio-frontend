import { Block, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import { useEffect, useMemo, useState } from "react";
import { Fragment } from "react";
import { Hotkey } from "../../core/Hotkey";

const hotkeys = Hotkey("SegmentationToolbar");

const keysDictionary = {
  plus: "+",
  minus: "-",
};

export const Tool = ({
  active = false,
  disabled = false,
  expanded = false,
  extraShortcuts = {},
  controls,
  icon,
  label,
  shortcut,
  onClick,
}) => {
  let currentShortcut = shortcut;

  const shortcutView = useMemo(() => {
    if (!isDefined(shortcut)) return null;

    const combos = shortcut.split(",").map(s => s.trim());

    return (
      <Elem name="shortcut">
        {combos.map((combo, index) => {
          const keys = combo.split("+");

          return (
            <Fragment key={`${keys.join('-')}-${index}`}>
              {keys.map(key => {
                return (
                  <Elem name="key" tag="kbd" key={key}>{keysDictionary[key] ?? key}</Elem>
                );
              })}
            </Fragment>
          );
        })}
      </Elem>
    );
  }, [shortcut]);

  useEffect(() => {
    const removeShortcuts = () => {
      if (currentShortcut && hotkeys.hasKey()) hotkeys.removeKey(currentShortcut);
    };

    removeShortcuts();
    currentShortcut = shortcut;
    if (shortcut && !hotkeys.hasKey(shortcut)) {
      hotkeys.addKey(shortcut, () => {
        onClick?.();
      }, label);
    }

    return () => removeShortcuts();
  }, [shortcut]);

  useEffect(() => {
    const removeShortcuts = () => {
      Object.keys(extraShortcuts).forEach((key) => {
        if (hotkeys.hasKey(key)) hotkeys.removeKey(key);
      });
    };

    const addShortcuts = () => {
      Object.entries(extraShortcuts).forEach(([key, [label, fn]]) => {
        if (!hotkeys.hasKey(key)) hotkeys.addKey(key, fn, label);
      });
    };

    if (active) {
      addShortcuts();
    } else {
      removeShortcuts();
    }

    return removeShortcuts;
  }, [extraShortcuts, active]);

  return (
    <Block name="tool" mod={{ active, disabled }} onClick={onClick}>
      <Elem name="icon">
        {icon}
      </Elem>
      {expanded ? (
        <Elem name="label">{label} {shortcutView}</Elem>
      ) : (isDefined(label) || isDefined(shortcutView)) && (
        <Elem name="tooltip">{label} {shortcutView}</Elem>
      )}
      {controls?.length && active && (
        <Elem name="controls">
          {controls}
        </Elem>
      )}
    </Block>
  );
};

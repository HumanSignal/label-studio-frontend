import React from "react";
import { Tag } from "antd";
import { observer, inject } from "mobx-react";
import { types, getParent } from "mobx-state-tree";

import Hint from "../../components/Hint/Hint";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import { guidGenerator } from "../../core/Helpers";
import { Hotkey } from "../../core/Hotkey";

/**
 * Shortcut tag can be used to define a shortcut, which adds a predefined object
 * @example
 * <View>
 *   <TextArea name="txt-1">
 *     <Shortcut alias="Silence" value="SILENCE" hotkey="ctrl+1" />
 *   </TextArea>
 * </View>
 * @name Shortcut
 * @param {string} value    - A value of the shortcut
 * @param {string} [alias]  - Shortcut alias
 * @param {string} [hotkey] - Hotkey
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  alias: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    type: "shortcut",
    _value: types.optional(types.string, ""),
  })
  .volatile(() => ({
    hotkeyScope: Hotkey.INPUT_SCOPE,
  }))
  .actions(self => ({
    onClick() {
      const textarea = getParent(self, 2);

      if (textarea.onShortcut) textarea.onShortcut(self.value);
    },

    onHotKey(event) {
      const textarea = getParent(self, 2);
      const name = (event.target || event.srcElement).name;
      // fired on a wrong element

      if (textarea.name !== name) return;
      return self.onClick();
    },
  }));

const ShortcutModel = types.compose("ShortcutModel", TagAttrs, Model, ProcessAttrsMixin);

const HtxShortcutView = inject("store")(
  observer(({ item, store }) => {
    const bg = {
      backgroundColor: item.selected ? item.background : "#e8e8e8",
      color: item.selected ? item.selectedcolor : "#333333",
      cursor: "pointer",
      margin: "5px",
    };

    return (
      <Tag
        onClick={() => {
          item.onClick();
          return false;
        }}
        style={bg}
      >
        {item.alias ? item.alias : item._value}
        {store.settings.enableTooltips && store.settings.enableHotkeys && item.hotkey && <Hint>[{item.hotkey}]</Hint>}
      </Tag>
    );
  }),
);

Registry.addTag("shortcut", ShortcutModel, HtxShortcutView);

export { HtxShortcutView, ShortcutModel };

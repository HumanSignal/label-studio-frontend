import React from "react";
import { types, getRoot, getType } from "mobx-state-tree";
import { observer } from "mobx-react";
import { Typography, Input } from "antd";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import lodash from "../../utils/lodash";

const { Search } = Input;

/**
 * Filter tag, show filter
 * @example
 * <Filter name="text-1" value="$text" />
 * @example
 * <Filter name="text-1" value="Please select the class" />
 * @name Filter
 * @param {string} value              - text of filter
 * @param {number} [size=4]           - size of filter
 * @param {string} [style]            - css style string
 * @param {boolean} [underline=false] - underline of filter
 */

const TagAttrs = types.model({
  casesensetive: types.optional(types.boolean, false),

  cleanup: types.optional(types.boolean, true),

  placeholder: types.optional(types.string, "Quick Filter"),
  minlength: types.optional(types.string, "3"),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    type: "filter",
    _value: types.maybeNull(types.string),
    name: types.maybeNull(types.string),
    toname: types.maybeNull(types.string),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get toTag() {
      return self.completion.names.get(self.toname);
    },
  }))
  .actions(self => ({
    applyFilter() {
      let value = self._value;
      const tch = self.toTag.tiedChildren;

      if (value.length <= Number(self.minlength)) {
        tch.filter(ch => !ch.visible).forEach(ch => ch.setVisible(true));
        return;
      }

      if (!self.casesensetive) value = value.toLowerCase();

      tch.forEach(ch => {
        let chval = ch._value;
        if (!self.casesensetive) chval = chval.toLowerCase();

        if (chval.indexOf(value) !== -1) ch.setVisible(true);
        else ch.setVisible(false);
      });
    },

    applyFilterEv(e) {
      let { value } = e.target;
      self._value = value;

      self.applyFilter();
    },

    onHotKey() {
      if (self._ref) {
        self._ref.focus();
      }

      return false;
    },

    setInputRef(ref) {
      self._ref = ref;
    },

    selectFirstElement() {
      const selected = self.toTag.selectFirstVisible();
      if (selected && self.cleanup) {
        self._value = "";
        self.applyFilter();
      }
    },
  }));

const FilterModel = types.compose("FilterModel", Model, TagAttrs, ProcessAttrsMixin);

const HtxFilter = observer(({ item }) => {
  const tag = item.toTag;

  if (tag.type.indexOf("labels") === -1 && tag.type.indexOf("choices") === -1) return null;

  return (
    <Input
      ref={ref => {
        item.setInputRef(ref);
      }}
      value={item._value}
      size="small"
      /* addonAfter={"clear"} */
      onChange={item.applyFilterEv}
      onPressEnter={item.selectFirstElement}
      placeholder={item.placeholder}
    />
  );
});

Registry.addTag("filter", FilterModel, HtxFilter);

export { HtxFilter, FilterModel };

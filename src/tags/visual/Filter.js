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
 * Filter tag, show filter input to seek through classes
 * @example
 * <View>
 *  <Filter name="text-1" toName="labels" />
 *  <Labels name="labels" toName="text">
 *    <Label value="Hello" />
 *    <Label value="World" />
 *  </Labels>
 *  <Text name="text" value="$text" />
 * </View>
 * @name Filter
 * @param {boolean} [casesensetive=false] - case sensetive or insensetive match
 * @param {boolean} [cleanup=true]        - remove the search if you click Enter
 * @param {string} placeholder            - placeholder for the empty filter
 * @param {number} [minlength=3]          - length of string after which to initiate the search
 * @param {string} hotkey                 - hotkey that activate the search
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

      if (Number(self.minlength) > value.length) {
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

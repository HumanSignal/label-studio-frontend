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
  placeholder: types.optional(types.string, "Quick Filter"),
  minlength: types.optional(types.string, "3"),
});

const Model = types
  .model({
    type: "filter",
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
    applyFilter(e) {
      let { value } = e.target;
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
  }));

const FilterModel = types.compose("FilterModel", Model, TagAttrs, ProcessAttrsMixin);

const HtxFilter = observer(({ item }) => {
  const tag = item.toTag;

  console.log(tag.type, tag.type.indexOf("labels"));

  if (tag.type.indexOf("labels") === -1 && tag.type.indexOf("choices") === -1) return null;

  console.log();

  return (
    <Input
      size="small"
      /* addonAfter={"clear"} */
      onChange={item.applyFilter}
      placeholder={item.placeholder}
    />
  );
});

Registry.addTag("filter", FilterModel, HtxFilter);

export { HtxFilter, FilterModel };

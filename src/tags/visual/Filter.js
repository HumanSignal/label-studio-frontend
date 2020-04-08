import React from "react";
import { types, getRoot, getType } from "mobx-state-tree";
import { observer } from "mobx-react";
import { Typography, Input } from "antd";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";

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
  }));

const FilterModel = types.compose("FilterModel", Model, ProcessAttrsMixin);

const HtxFilter = observer(({ item }) => {
  const tag = item.toTag;

  if (tag.type.indexOf("labels") === -1) return null;

  return (
    <Input
      size="small"
      /* addonAfter={"clear"} */
      onChange={e => {
        const { value } = e.target;
        if (value) {
          // tag.
        }
      }}
      placeholder="Filter Labels"
    />
  );
});

Registry.addTag("filter", FilterModel, HtxFilter);

export { HtxFilter, FilterModel };

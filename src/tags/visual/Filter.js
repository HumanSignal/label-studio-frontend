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

var timer = function(name) {
  var start = new Date();
  return {
    stop: function() {
      var end = new Date();
      var time = end.getTime() - start.getTime();
      console.log("Timer:", name, "finished in", time, "ms");
    },
  };
};

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
      var t = timer("applyFilter");

      let { value } = e.target;
      const tch = self.toTag.tiedChildren;

      if (value.length <= Number(self.minlength)) {
        tch.filter(ch => !ch.visible).forEach(ch => ch.setVisible(true));
        return;
      }

      if (!self.casesensetive) value = value.toLowerCase();

      // if (value) {
      // tag.

      tch.forEach(ch => {
        let chval = ch._value;
        if (!self.casesensetive) chval = chval.toLowerCase();

        if (chval.indexOf(value) !== -1) ch.setVisible(true);
        else ch.setVisible(false);
      });
      // }

      t.stop();
    },
  }));

const FilterModel = types.compose("FilterModel", Model, TagAttrs, ProcessAttrsMixin);

const HtxFilter = observer(({ item }) => {
  const tag = item.toTag;

  // if (tag._type !== "labels") return null;
  //   if (tag._type !== 'choices') return null;

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

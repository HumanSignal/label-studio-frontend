import React, { useCallback, useLayoutEffect, useState } from "react";
import { Alert, Select } from "antd";
import { inject, observer } from "mobx-react";
import { types } from "mobx-state-tree";
import isNil from "lodash/isNil";

import RequiredMixin from "../../mixins/Required";
import PerRegionMixin from "../../mixins/PerRegion";
import Registry from "../../core/Registry";
import VisibilityMixin from "../../mixins/Visibility";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";

import "./Choice";
import { parseValue } from "../../utils/data";

/**
 * Use the ChoicesList tag to create a group of choices, with checkboxes.
 * Can be used for single or multi-class classification.
 * Use for advanced classification tasks where annotators can choose one or multiple answers.
 *
 * Use with the following data types: audio, image, HTML, paragraphs, text, time series, video
 * @example
 * <!--Basic text classification labeling configuration-->
 * <View>
 *   <ChoicesList name="gender" toName="txt-1" options=$dataLinkJSON />
 * </View>
 * @name ChoicesList
 * @meta_title ChoicesList Tag for Single/Multiple Choice Labels with json data dependent options prop.
 * @meta_description Customize Label Studio with multiple choice labels for machine learning and data science projects.
 * @param {string} name                - Name of the group of choices
 * @param {string} toName              - Name of the data item that you want to label
 * @param {boolean} multiple           - Widget type single/mutiple
 * @param {string} options             - Name of variable in data.json structure. Shape: {label: string, value: any}[]
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
  options: types.string,
  multiple: types.maybe(types.boolean),
});

const Model = types
  .model({
    pid: types.optional(types.string, guidGenerator),
    _options: types.maybe(types.array(types.model({ value: types.identifier, label: types.string }))),
    _sel: types.maybe(types.union(types.array(types.string), types.string)),
    type: "choiceslist",
    // children: Types.,
  })
  .views(self => {
    return {
      selectedValues() {
        return self._sel;
      },

      get result() {
        if (self.perregion) {
          const area = self.annotation.highlightedNode;

          if (!area) return null;
          return self.annotation.results.find(r => r.from_name === self && r.area === area);
        }
        return self.annotation.results.find(r => r.from_name === self);
      },
    };
  })
  .actions(self => {
    return {
      initOptions(options) {
        self._options = options;
      },
      setSelected(val) {
        const valueAdjusted = (Array.isArray(val) ? val : [val]).filter((v) => !isNil(v));

        self._sel = val;
        if (self.result) {
          self.result.area.setValue(self);
        } else {
          if (self.perregion) {
            const area = self.annotation.highlightedNode;

            if (!area) return null;
            area.setValue(self);
          } else {
            self.annotation.createResult({}, { choices: valueAdjusted }, self, self.toname);
          }
        }
      },
    };
  });

const ChoicesListModel = types.compose(
  "ChoicesListModel",
  ControlBase,
  TagAttrs,
  RequiredMixin,
  PerRegionMixin,
  VisibilityMixin,
  Model,
  AnnotationMixin,
);

const HtxChoicesList = inject("store")(observer(({ item, store }) => {

  const [isOptionsInvalid, setIsOptionsInvalid] = useState(false);
  const validateOptions = useCallback((options) => {
    return options?.every?.((option) => !isNil(option.label) && !isNil(option.value));
  }, []);

  useLayoutEffect(() => {
    const options = JSON.parse(parseValue(item.options, store.task.dataObj));

    if (!validateOptions(options)) {
      setIsOptionsInvalid(true);
      return;
    }
    item.initOptions(options);
  }, []);

  const valueAdjusted = typeof item._sel === 'object' ? item._sel?.toJSON() : item._sel;

  if (isOptionsInvalid) return (
    <Alert
      type="error"
      message={`Options provided to ${item.name} are invalid`}
    />
  );
  return (
    <Select
      allowClear
      style={{ width: "100%" }}
      value={valueAdjusted}
      options={item._options}
      mode={item.multiple ? 'multiple' : undefined}
      onChange={(val) => {
        item.setSelected(val);
      }}
    >

    </Select>
  );
}));

Registry.addTag("choiceslist", ChoicesListModel, HtxChoicesList);

export { HtxChoicesList, ChoicesListModel, TagAttrs };

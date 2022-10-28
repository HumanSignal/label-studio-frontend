import React from "react";
import { Form, Select } from "antd";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import RequiredMixin from "../../mixins/Required";
import PerRegionMixin from "../../mixins/PerRegion";
import InfoModal from "../../components/Infomodal/Infomodal";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import VisibilityMixin from "../../mixins/Visibility";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { Block, Elem } from "../../utils/bem";
import "./Choices/Choises.styl";

import "./Choice";
import DynamicChildrenMixin from "../../mixins/DynamicChildrenMixin";
import { FF_DEV_2007, FF_DEV_2007_DEV_2008, isFF } from "../../utils/feature-flags";

const { Option } = Select;

/**
 * Use the Choices tag to create a group of choices, with radio buttons or checkboxes. Can be used for single or multi-class classification. Use for advanced classification tasks where annotators can choose one or multiple answers.
 *
 * Choices can have dynamic value to load labels from task. This task data should contain a list of options to create underlying <Choice>s. All the parameters from options will be transferred to corresponding tags.
 *
 * The Choices tag can be used with any data types.
 * @example
 * <!--Basic text classification labeling configuration-->
 * <View>
 *   <Choices name="gender" toName="txt-1" choice="single-radio">
 *     <Choice alias="M" value="Male" />
 *     <Choice alias="F" value="Female" />
 *     <Choice alias="NB" value="Nonbinary" />
 *     <Choice alias="X" value="Other" />
 *   </Choices>
 *   <Text name="txt-1" value="John went to see Mary" />
 * </View>
 *
 * @example <caption>This config with dynamic labels</caption>
 * <View>
 *   <Audio name="audio" value="$audio" />
 *   <Choices name="transcription" toName="audio" value="$variants" />
 * </View>
 * <!-- {
 *   "data": {
 *     "variants": [
 *       { "value": "Do or doughnut. There is no try." },
 *       { "value": "Do or do not. There is no trial." },
 *       { "value": "Do or do not. There is no try." },
 *       { "value": "Duo do not. There is no try." }
 *     ]
 *   }
 * } -->
 * @example <caption>is equivalent to this config</caption>
 * <View>
 *   <Audio name="audio" value="$audio" />
 *   <Choices name="transcription" toName="audio" value="$variants">
 *     <Choice value="Do or doughnut. There is no try." />
 *     <Choice value="Do or do not. There is no trial." />
 *     <Choice value="Do or do not. There is no try." />
 *     <Choice value="Duo do not. There is no try." />
 *   </Choices>
 * </View>
 * @name Choices
 * @meta_title Choices Tag for Multiple Choice Labels
 * @meta_description Customize Label Studio with multiple choice labels for machine learning and data science projects.
 * @param {string} name                - Name of the group of choices
 * @param {string} toName              - Name of the data item that you want to label
 * @param {single|single-radio|multiple} [choice=single] - Single or multi-class classification
 * @param {boolean} [showInline=false] - Show choices in the same visual line
 * @param {boolean} [required=false]   - Validate whether a choice has been selected
 * @param {string} [requiredMessage]   - Show a message if validation fails
 * @param {region-selected|choice-selected|no-region-selected} [visibleWhen] - Control visibility of the choices.
 * @param {string} [whenTagName]       - Use with visibleWhen. Narrow down visibility by name of the tag. For regions, use the name of the object tag, for choices, use the name of the choices tag
 * @param {string} [whenLabelValue]    - Narrow down visibility by label value
 * @param {string} [whenChoiceValue]   - Narrow down visibility by choice value
 * @param {boolean} [perRegion]        - Use this tag to select a choice for a specific region instead of the entire task
 * @param {string} [value]             - Task data field containing a list of dynamically loaded choices (see example below)
 * @param {boolean} [allowNested]      - Allow to use `children` field in dynamic choices to nest them. Submitted result will contain array of arrays, every item is a list of values from topmost parent choice down to selected one.
 */
const TagAttrs = types.model({
  toname: types.maybeNull(types.string),

  showinline: types.maybeNull(types.boolean),

  choice: types.optional(types.enumeration(["single", "single-radio", "multiple"]), "single"),

  layout: types.optional(types.enumeration(["select", "inline", "vertical"]), "vertical"),

  ...(isFF(FF_DEV_2007_DEV_2008) ? { value: types.optional(types.string, "") } : {}),

  allownested: types.optional(types.boolean, false),
});

const Model = types
  .model({
    pid: types.optional(types.string, guidGenerator),

    readonly: types.optional(types.boolean, false),
    visible: types.optional(types.boolean, true),

    type: "choices",
    children: Types.unionArray(["choice", "view", "header", "hypertext"]),
  })
  .views(self => ({
    get shouldBeUnselected() {
      return self.choice === "single" || self.choice === "single-radio";
    },

    states() {
      return self.annotation.toNames.get(self.name);
    },

    get serializableValue() {
      const choices = self.selectedValues();

      if (choices && choices.length) return { choices };

      return null;
    },

    get result() {
      if (self.perregion) {
        const area = self.annotation.highlightedNode;

        if (!area) return null;

        return self.annotation.results.find(r => r.from_name === self && r.area === area);
      }
      return self.annotation.results.find(r => r.from_name === self);
    },

    get preselectedValues() {
      return self.tiedChildren.filter(c => c.selected === true && !c.isSkipped).map(c => c.resultValue);
    },

    get selectedLabels() {
      return self.tiedChildren.filter(c => c.sel === true && !c.isSkipped);
    },

    selectedValues() {
      return self.selectedLabels.map(c => c.resultValue);
    },

    get defaultChildType() {
      return "choice";
    },

    // perChoiceVisible() {
    //     if (! self.whenchoicevalue) return true;

    //     // this is a special check when choices are labeling other choices
    //     // may need to show
    //     if (self.whenchoicevalue) {
    //         const choicesTag = self.annotation.names.get(self.toname);
    //         const ch = choicesTag.findLabel(self.whenchoicevalue);

    //         if (ch && ch.selected)
    //             return true;
    //     }

    //     return false;
    // }
  }))
  .actions(self => ({
    afterCreate() {
      // TODO depricate showInline
      if (self.showinline === true) self.layout = "inline";
      if (self.showinline === false) self.layout = "vertical";
    },

    needsUpdate() {
      if (self.result) self.setResult(self.result.mainValue);
      else self.setResult([]);
    },

    requiredModal() {
      InfoModal.warning(self.requiredmessage || `Checkbox "${self.name}" is required.`);
    },

    copyState(choices) {
      choices.selectedValues().forEach(l => {
        self.findLabel(l).setSelected(true);
      });
    },

    // this is not labels, unselect affects result, so don't unselect on random reason
    unselectAll() {},

    updateFromResult(value) {
      self.setResult(Array.isArray(value) ? value : [value]);
    },

    // unselect only during choice toggle
    resetSelected() {
      self.selectedLabels.forEach(c => c.setSelected(false));
    },

    setResult(values) {
      self.tiedChildren.forEach(choice => choice.setSelected(
        !choice.isSkipped && values?.some?.((value) => {
          if (Array.isArray(value) && Array.isArray(choice.resultValue)) {
            return value.length === choice.resultValue.length && value.every?.((val, idx) => val === choice.resultValue?.[idx]);
          } else {
            return value === choice.resultValue;
          }
        }),
      ));
    },

    // update result in the store with current selected choices
    updateResult() {
      if (self.result) {
        self.result.area.setValue(self);
      } else {
        if (self.perregion) {
          const area = self.annotation.highlightedNode;

          if (!area) return null;
          area.setValue(self);
        } else {
          self.annotation.createResult({}, { choices: self.selectedValues() }, self, self.toname);
        }
      }
    },

    toStateJSON() {
      const names = self.selectedValues();

      if (names && names.length) {
        const toname = self.toname || self.name;

        return {
          id: self.pid,
          from_name: self.name,
          to_name: toname,
          type: self.type,
          value: {
            choices: names,
          },
        };
      }
    },

    fromStateJSON(obj) {
      self.unselectAll();

      if (!obj.value.choices) throw new Error("No labels param");

      if (obj.id) self.pid = obj.id;

      self.readonly = obj.readonly;

      obj.value.choices.forEach(l => {
        const choice = self.findLabel(l);

        if (!choice) throw new Error("No label " + l);

        choice.setSelected(true);
      });
    },
  }));

const ChoicesModel = types.compose(
  "ChoicesModel",
  ControlBase,
  TagAttrs,
  SelectedModelMixin.props({ _child: "ChoiceModel" }),
  RequiredMixin,
  PerRegionMixin,
  VisibilityMixin,
  ...(isFF(FF_DEV_2007_DEV_2008) ? [DynamicChildrenMixin] : []),
  Model,
  AnnotationMixin,
);

const ChoicesSelectLayout = observer(({ item }) => {
  return (
    <Select
      style={{ width: "100%" }}
      value={item.selectedLabels.map(l => l._value)}
      mode={item.choice === "multiple" ? "multiple" : ""}
      onChange={function(val) {
        if (Array.isArray(val)) {
          item.resetSelected();
          val.forEach(v => item.findLabel(v).setSelected(true));
          item.updateResult();
        } else {
          const c = item.findLabel(val);

          if (c) {
            c.toggleSelected();
          }
        }
      }}
    >
      {item.tiedChildren.map(i => (
        <Option key={i._value} value={i._value}>
          {i._value}
        </Option>
      ))}
    </Select>
  );
});

const HtxChoices = observer(({ item }) => {
  return (
    <Block name="choices" mod={{ hidden: !item.isVisible || !item.perRegionVisible(), layout: item.layout }}>
      {item.layout === "select" ? (
        <ChoicesSelectLayout item={item} />
      ) : (
        !isFF(FF_DEV_2007)
          ? <Form layout={item.layout}>{Tree.renderChildren(item, item.annotation)}</Form>
          : Tree.renderChildren(item, item.annotation)
      )}
    </Block>
  );
});

Registry.addTag("choices", ChoicesModel, HtxChoices);

export { HtxChoices, ChoicesModel, TagAttrs };

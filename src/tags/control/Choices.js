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

import "./Choice";

const { Option } = Select;

/**
 * Use the Choices tag to create a group of choices, radio buttons, or checkboxes. Can
 * be used for single or multi-class classification.
 * @example
 * <View>
 *   <Choices name="gender" toName="txt-1" choice="single-radio">
 *     <Choice alias="M" value="Male" />
 *     <Choice alias="F" value="Female" />
 *     <Choice alias="NB" value="Nonbinary" />
 *     <Choice alias="X" value="Other" />
 *   </Choices>
 *   <Text name="txt-1" value="John went to see Mary" />
 * </View>
 * @name Choices
 * @param {string} name                - Name of the group of choices
 * @param {string} toName              - Name of the data item that you want to label
 * @param {single|single-radio|multiple} [choice=single] - Single or multi-class classification
 * @param {boolean} [showInline=false] - Show items in the same visual line
 * @param {boolean} [required=false]   - Validate whether a choice has been selected
 * @param {string} [requiredMessage]   - Show a message if validation fails
 * @param {region-selected|choice-selected|no-region-selected} [visibleWhen] - When true, show the contents of a view
 * @param {string} [whenTagName]       - Narrow down visibility by name of the tag, for regions use the name of the object tag, for choices use the name of the choices tag
 * @param {string} [whenLabelValue]    - Narrow down visibility by label value
 * @param {string} [whenChoiceValue]   - Narrow down visibility by choice value
 * @param {boolean} [perRegion] use this tag for region labeling instead of the whole object labeling
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  showinline: types.maybeNull(types.boolean),

  choice: types.optional(types.enumeration(["single", "single-radio", "multiple"]), "single"),

  layout: types.optional(types.enumeration(["select", "inline", "vertical"]), "vertical"),
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
      return self.tiedChildren.filter(c => c.selected === true).map(c => (c.alias ? c.alias : c.value));
    },

    get selectedLabels() {
      return self.tiedChildren.filter(c => c.sel === true);
    },

    selectedValues() {
      return self.selectedLabels.map(c => (c.alias ? c.alias : c.value));
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
      self.tiedChildren.forEach(choice => choice.setSelected(values.includes(choice.alias || choice._value)));
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
  Model,
  AnnotationMixin,
);

const HtxChoices = observer(({ item }) => {
  const style = { marginTop: "1em", marginBottom: "1em" };
  const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };

  if (item.isVisible === false) {
    visibleStyle["display"] = "none";
  }

  return (
    <div style={{ ...style, ...visibleStyle }}>
      {item.layout === "select" ? (
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
      ) : (
        <Form layout={item.layout}>{Tree.renderChildren(item)}</Form>
      )}
    </div>
  );
});

Registry.addTag("choices", ChoicesModel, HtxChoices);

export { HtxChoices, ChoicesModel, TagAttrs };

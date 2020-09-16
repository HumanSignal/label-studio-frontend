import React from "react";
import { Form, Select } from "antd";
import { observer } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

import RequiredMixin from "../../mixins/Required";
import PerRegionMixin from "../../mixins/PerRegion";
import InfoModal from "../../components/Infomodal/Infomodal";
import Registry from "../../core/Registry";
import SelectedModelMixin from "../../mixins/SelectedModel";
import VisibilityMixin from "../../mixins/Visibility";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { ChoiceModel } from "./Choice"; // eslint-disable-line no-unused-vars
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

const { Option } = Select;

/**
 * Choices tag, create a group of choices, radio, or checkboxes. Shall
 * be used for a single or multi-class classification.
 * @example
 * <View>
 *   <Choices name="gender" toName="txt-1" choice="single-radio">
 *     <Choice alias="M" value="Male" />
 *     <Choice alias="F" value="Female" />
 *   </Choices>
 *   <Text name="txt-1" value="John went to see Marry" />
 * </View>
 * @name Choices
 * @param {string} name                - name of the group
 * @param {string} toName              - name of the element that you want to label
 * @param {single|single-radio|multiple} [choice=single] - single or multi-class
 * @param {boolean} [showInline=false] - show items in the same visual line
 * @param {boolean} [required=false]   - validation if choice has been selected
 * @param {string} [requiredMessage]   - message to show if validation fails
 * @param {region-selected|choice-selected|no-region-selected} [visibleWhen] show the contents of a view when condition is true
 * @param {string} [whenTagName] narrow down visibility by name of the tag, for regions use the name of the object tag, for choices use the name of the choices tag
 * @param {string} [whenLabelValue] narrow down visibility by label value
 * @param {string} [whenChoiceValue] narrow down visibility by choice value
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
    // id: types.optional(types.identifier, guidGenerator),
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

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    get serializableValue() {
      const choices = self.selectedValues();
      if (choices && choices.length) return { choices };

      return null;
    },

    get result() {
      if (self.perregion) {
        const area = self.completion.highlightedNode;
        if (!area) return null;

        return self.completion.results.find(r => r.from_name === self && r.area === area);
      }
      return self.completion.results.find(r => r.from_name === self);
    },

    // perChoiceVisible() {
    //     if (! self.whenchoicevalue) return true;

    //     // this is a special check when choices are labeling other choices
    //     // may need to show
    //     if (self.whenchoicevalue) {
    //         const choicesTag = self.completion.names.get(self.toname);
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
      self.result && self.setResult(self.result.mainValue);
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

    // unselect only during choice toggle
    resetSelected() {
      self.selectedLabels.forEach(c => c.setSelected(false));
    },

    setResult(values) {
      self.tiedChildren.forEach(choice => choice.setSelected(values.includes(choice.alias || choice._value)));
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

    fromStateJSON(obj, fromModel) {
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
);

const HtxChoices = observer(({ item }) => {
  const style = { marginTop: "1em", marginBottom: "1em" };
  const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };

  if (item.isVisible === false) {
    item.unselectAll();
    visibleStyle["display"] = "none";
  }

  return (
    <div style={{ ...style, ...visibleStyle }}>
      {item.layout === "select" ? (
        <Select
          style={{ width: "100%" }}
          defaultValue={item.selectedLabels.map(l => l._value)}
          mode={item.choice === "multiple" ? "multiple" : ""}
          onChange={function(val, opt) {
            if (Array.isArray(val)) {
              item.unselectAll();
              val.forEach(v => item.findLabel(v).setSelected(true));
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

import React, { Component } from "react";
import { Checkbox, Form, Radio } from "antd";
import { inject, observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Hint from "../../components/Hint/Hint";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { TagParentMixin } from "../../mixins/TagParentMixin";

/**
 * The Choice tag represents a single choice for annotations. Use with the Choices tag or Taxonomy tag to provide specific choice options.
 *
 * @example
 * <!--Basic text classification labeling configuration-->
 * <View>
 *   <Choices name="gender" toName="txt-1" choice="single">
 *     <Choice value="Man" />
 *     <Choice value="Woman" />
 *     <Choice value="Nonbinary" />
 *     <Choice value="Other" />
 *   </Choices>
 *   <Text name="txt-1" value="John went to see Mary" />
 * </View>
 * @name Choice
 * @meta_title Choice Tag for Single Choice Labels
 * @meta_description Customize Label Studio with choice tags for simple classification tasks in machine learning and data science projects.
 * @param {string} value       - Choice value
 * @param {boolean} [selected] - Specify whether to preselect this choice on the labeling interface
 * @param {string} [alias]     - Alias for the choice. If used, the alias replaces the choice value in the annotation results. Alias does not display in the interface.
 * @param {style} [style]      - CSS style of the checkbox element
 * @param {string} [hotkey]    - Hotkey for the selection
 */
const TagAttrs = types.model({
  selected: types.optional(types.boolean, false),
  alias: types.maybeNull(types.string),
  value: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  style: types.maybeNull(types.string),
});

const Model = types
  .model({
    type: "choice",
    visible: types.optional(types.boolean, true),
    _value: types.optional(types.string, ""),
    // hierarchical Choices used for Taxonomy
    children: Types.unionArray(["choice"]),
    parentTypes: Types.tagsTypes(["Choices", "Taxonomy"]),
  })
  .views(self => ({
    get isCheckbox() {
      const choice = self.parent?.choice;

      return choice === "multiple" || choice === "single";
    },

    get isSelect() {
      return self.parent?.layout === "select";
    },

    // to conform Label's maxUsages check
    canBeUsed() {
      return true;
    },
  }))
  .volatile(() => ({
    // `selected` is a predefined parameter, we cannot use it for state, so use `sel`
    sel: false,
  }))
  .actions(self => ({
    toggleSelected() {
      const choices = self.parent;

      choices.shouldBeUnselected && choices.resetSelected?.();

      self.setSelected(!self.sel);

      choices.updateResult?.();
    },

    setVisible(val) {
      self.visible = val;
    },

    setSelected(val) {
      self.sel = val;
    },
  }))
  .actions(self => {
    if (self.parent.type === "choices") return {
      onHotKey() {
        return self.toggleSelected();
      },
    };
    return {};
  });

const ChoiceModel = types.compose("ChoiceModel", TagParentMixin, TagAttrs, Model, ProcessAttrsMixin, AnnotationMixin);

class HtxChoiceView extends Component {
  render() {
    const { item, store } = this.props;
    let style = {};

    if (item.style) style = Tree.cssConverter(item.style);

    if (!item.visible) {
      style["display"] = "none";
    }

    const showHotkey =
      (store.settings.enableTooltips || store.settings.enableLabelTooltips) &&
      store.settings.enableHotkeys &&
      item.hotkey;

    const props = {
      checked: item.sel,
      disabled: item.parent?.readonly,
      onChange: ev => {
        if (!item.annotation.editable) return;
        item.toggleSelected();
        ev.nativeEvent.target.blur();
      },
    };

    if (item.isCheckbox) {
      const cStyle = Object.assign({ display: "flex", alignItems: "center", marginBottom: 0 }, style);

      return (
        <Form.Item style={cStyle}>
          <Checkbox name={item._value} {...props}>
            {item._value}
            {showHotkey && <Hint>[{item.hotkey}]</Hint>}
          </Checkbox>
        </Form.Item>
      );
    } else {
      return (
        <div style={style}>
          <Radio value={item._value} style={{ display: "inline-block", marginBottom: "0.5em" }} {...props}>
            {item._value}
            {showHotkey && <Hint>[{item.hotkey}]</Hint>}
          </Radio>
        </div>
      );
    }
  }
}

const HtxChoice = inject("store")(observer(HtxChoiceView));

Registry.addTag("choice", ChoiceModel, HtxChoice);

export { HtxChoice, ChoiceModel };

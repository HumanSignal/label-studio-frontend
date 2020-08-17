import React, { Component } from "react";
import { Checkbox, Radio, Form } from "antd";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getRoot } from "mobx-state-tree";

import Hint from "../../components/Hint/Hint";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { ChoicesModel } from "./Choices";

/**
 * Choice tag represents a single choice
 *
 * @example
 * <View>
 *   <Choices name="gender" toName="txt-1" choice="single">
 *     <Choice value="Male" />
 *     <Choice value="Female" />
 *   </Choices>
 *   <Text name="txt-1" value="John went to see Marry" />
 * </View>
 * @name Choice
 * @param {string} value       - choice value
 * @param {boolean} [selected] - if this label should be preselected
 * @param {string} [alias]     - alias for the label
 * @param {style} [style]      - css style of the checkbox element
 * @param {string} [hotkey]    - hotkey
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
  })
  .views(self => ({
    get isCheckbox() {
      const choice = self.parent.choice;
      return choice === "multiple" || choice === "single";
    },

    get isSelect() {
      console.log(self.parent.layout);
      return self.parent.layout === "select";
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get parent() {
      return getParentOfType(self, ChoicesModel);
    },

    // to conform Label's maxUsages check
    canBeUsed() {
      return true;
    },
  }))
  .actions(self => ({
    toggleSelected() {
      const choices = self.parent;

      choices.shouldBeUnselected && choices.resetSelected();

      self.setSelected(!self.selected);

      choices.updateResult();
    },

    setVisible(val) {
      self.visible = val;
    },

    setSelected(val) {
      self.selected = val;
    },

    onHotKey() {
      return self.toggleSelected();
    },
  }));

const ChoiceModel = types.compose("ChoiceModel", TagAttrs, Model, ProcessAttrsMixin);

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
      checked: item.selected,
      disabled: item.parent.readonly,
      onChange: ev => {
        if (!item.completion.editable) return;
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

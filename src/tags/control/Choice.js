import React, { Component, useCallback, useState } from "react";
import { Button, Checkbox, Form, Radio } from "antd";
import { inject, observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Hint from "../../components/Hint/Hint";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree, { TRAVERSE_STOP } from "../../core/Tree";
import Types from "../../core/Types";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { TagParentMixin } from "../../mixins/TagParentMixin";
import { FF_DEV_2007, FF_DEV_2244, FF_DEV_3391, isFF } from "../../utils/feature-flags";
import { Block, Elem } from "../../utils/bem";
import "./Choice/Choice.styl";
import { LsChevron } from "../../assets/icons";

/**
 * The `Choice` tag represents a single choice for annotations. Use with the `Choices` tag or `Taxonomy` tag to provide specific choice options.
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
  ...(isFF(FF_DEV_3391) ? { id: types.identifier } : {}),
  selected: types.optional(types.boolean, false),
  alias: types.maybeNull(types.string),
  value: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  style: types.maybeNull(types.string),
  ...(isFF(FF_DEV_2007) ? { html: types.maybeNull(types.string) } : {} ),
});

const Model = types
  .model({
    type: "choice",
    visible: types.optional(types.boolean, true),
    _value: types.optional(types.string, ""),
    // hierarchical Choices used for Taxonomy
    children: Types.unionArray(["choice"]),
    parentTypes: Types.tagsTypes(["Choices", "Taxonomy"]),
    readonly: types.optional(types.boolean, false),
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
    get isLeaf() {
      if (!self.nestedResults) return true;

      return !self.children?.length;
    },

    get sel() {
      return !isFF(FF_DEV_2244) || self.isLeaf ? self._sel : self.children.every(child => child.sel === true);
    },

    get indeterminate() {
      return isFF(FF_DEV_2244) && (self.isLeaf ? false : !self.sel && self.children.some(child => child.sel === true));
    },

    get parentChoice() {
      return Types.getParentTagOfTypeString(self, "choice");
    },
    get isSkipped() {
      return !self.nestedResults && !!self.parentChoice;
    },
    get nestedResults() {
      return isFF(FF_DEV_2007) && self.parent?.allownested !== false;
    },
    get _resultValue() {
      return self.alias ?? self._value;
    },
    get resultValue() {
      if (isFF(FF_DEV_2007) && self.nestedResults) {
        const value = [];
        let choice = self;

        while (choice) {
          value.unshift(choice._resultValue);
          choice = choice.parentChoice;
        }
        return value;
      } else {
        return self._resultValue;
      }
    },
  }))
  .volatile(() => ({
    // `selected` is a predefined parameter, we cannot use it for state, so use `sel`
    _sel: false,
  }))
  .actions(self => ({
    toggleSelected() {
      if (self.parent?.readonly || !self.annotation?.editable) return;
      const choices = self.parent;
      const selected = self.sel;

      choices.shouldBeUnselected && choices.resetSelected?.();

      self.setSelected(!selected);

      choices.updateResult?.();
    },

    setVisible(val) {
      self.visible = val;
    },

    setSelected(val) {
      self._sel = val;
      if (!self.isLeaf) {
        self.children.forEach((child)=>{
          child.setSelected(val);
        });
      }
    },
  }))
  .actions(self => {
    if (self.parent?.type === "choices") return {
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

// `name` can't be passed into bem components
const nameWrapper = (Component, name) => {
  return props => <Component {...props} name={name} />;
};

const HtxNewChoiceView = ({ item, store }) => {
  let style = {};

  if (item.style) style = Tree.cssConverter(item.style);

  const showHotkey =
    (store.settings.enableTooltips || store.settings.enableLabelTooltips) &&
    store.settings.enableHotkeys &&
    item.hotkey;

  const changeHandler = useCallback((ev) => {
    if (!item.annotation.editable) return;
    item.toggleSelected();
    ev.nativeEvent.target.blur();
  }, []);

  const [collapsed, setCollapsed] = useState(false);
  const toogleCollapsed = useCallback(() => setCollapsed(collapsed => !collapsed), []);

  return (
    <Block name="choice"
      mod={{ layout: item.parent.layout, leaf: item.isLeaf, notLeaf: !item.isLeaf, hidden: !item.visible }}>
      <Elem name="item" mod={{ notLeaf: !item.isLeaf }} style={style}>
        <Elem
          name="checkbox"
          component={nameWrapper(item.isCheckbox ? Checkbox : Radio, item._value)}
          mod={{ notLeaf: !item.isLeaf }}
          checked={item.sel}
          indeterminate={!item.sel && item.indeterminate}
          disabled={item.parent?.readonly}
          onChange={changeHandler}
        >
          {item.html ? <span dangerouslySetInnerHTML={{ __html: item.html }}/> :  item._value }
          {showHotkey && (<Hint>[{item.hotkey}]</Hint>)}
        </Elem>
        {!item.isLeaf ? (
          <Elem name="toggle" mod={{ collapsed }} component={Button} type="text" onClick={toogleCollapsed}>
            <LsChevron />
          </Elem>
        ) : false}
      </Elem>
      {
        item.nestedResults && item.children?.length
          ? <Elem name="children" mod={{ collapsed }}>{Tree.renderChildren(item, item.annotation)}</Elem>
          : null
      }
    </Block>
  );
};

const HtxOldChoice = inject("store")(observer(HtxChoiceView));
const HtxNewChoice = inject("store")(observer(HtxNewChoiceView));

const HtxChoice = (props) => {
  const HtxChoiceComponent = !isFF(FF_DEV_2007) ? HtxOldChoice : HtxNewChoice;

  return <HtxChoiceComponent {...props} />;
};

Registry.addTag("choice", ChoiceModel, HtxChoice);

export { HtxChoice, ChoiceModel };

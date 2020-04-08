import React from "react";
import { Form } from "antd";
import { observer } from "mobx-react";
import { types, getRoot, getParent } from "mobx-state-tree";

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
 */
const TagAttrs = types.model({
  name: types.string,
  toname: types.maybeNull(types.string),
  showinline: types.optional(types.boolean, false),
  choice: types.optional(types.enumeration(["single", "single-radio", "multiple"]), "single"),
  readonly: types.optional(types.boolean, false),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

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
    requiredModal() {
      InfoModal.warning(self.requiredmessage || `Checkbox "${self.name}" is required.`);
    },

    copyState(choices) {
      choices.selectedValues.forEach(l => {
        self.findLabel(l).setSelected(true);
      });
    },

    toStateJSON() {
      const names = self.selectedValues;

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
  Model,
  TagAttrs,
  SelectedModelMixin.props({ _child: "ChoiceModel" }),
  RequiredMixin,
  PerRegionMixin,
  VisibilityMixin,
  ControlBase,
);

const HtxChoices = observer(({ item }) => {
  const style = { marginTop: "1em", marginBottom: "1em" };
  const region = item.completion.highlightedNode;
  const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };

  if (item.isVisible === false) {
    item.unselectAll();
    visibleStyle["display"] = "none";
  }

  return (
    <div style={{ ...style, ...visibleStyle }}>
      {item.showinline ? (
        <Form layout="inline">{Tree.renderChildren(item)}</Form>
      ) : (
        <Form layout="vertical">{Tree.renderChildren(item)}</Form>
      )}
    </div>
  );
});

Registry.addTag("choices", ChoicesModel, HtxChoices);

export { HtxChoices, ChoicesModel, TagAttrs };

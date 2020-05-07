import React from "react";
import { Form, Input, Button } from "antd";
import { observer } from "mobx-react";
import { types, destroy, getRoot } from "mobx-state-tree";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import RequiredMixin from "../../mixins/Required";
import PerRegionMixin from "../../mixins/PerRegion";
import InfoModal from "../../components/Infomodal/Infomodal";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { HtxTextAreaRegion, TextAreaRegionModel } from "../../regions/TextAreaRegion";
import { guidGenerator } from "../../core/Helpers";
import { cloneNode } from "../../core/Helpers";
import ControlBase from "./Base";

const { TextArea } = Input;

/**
 * TextArea tag shows the textarea for user input
 * @example
 * <View>
 *   <TextArea name="ta"></TextArea>
 * </View>
 * @name TextArea
 * @param {string} name name of the element
 * @param {string} toName name of the element that you want to label if any
 * @param {string} value
 * @param {string=} [label] label text
 * @param {string=} [placeholder] placeholder text
 * @param {string=} [maxSubmissions] maximum number of submissions
 * @param {boolean=} [editable=false] editable textarea results
 * @param {number} [rows] number of rows in the textarea
 * @param {boolean} [required=false]   - validation if textarea is required
 * @param {string} [requiredMessage]   - message to show if validation fails
 * @param {boolean=} [showSubmitButton] show submit button or hide it, it's shown by default when rows is more than one (i.e. textarea mode)
 * @param {boolean} [perRegion] use this tag for region labeling instead of the whole object labeling
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),
  allowsubmit: types.optional(types.boolean, true),
  label: types.optional(types.string, ""),
  value: types.maybeNull(types.string),
  rows: types.optional(types.string, "1"),
  showsubmitbutton: types.optional(types.boolean, false),
  placeholder: types.maybeNull(types.string),
  maxsubmissions: types.maybeNull(types.string),
  editable: types.optional(types.boolean, false),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    type: "textarea",
    regions: types.array(TextAreaRegionModel),

    _value: types.optional(types.string, ""),
    children: Types.unionArray(["shortcut"]),
  })
  .views(self => ({
    get holdsState() {
      return self.regions.length > 0;
    },

    get submissionsNum() {
      return self.regions.length;
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get showSubmit() {
      if (self.maxsubmissions) {
        const num = parseInt(self.maxsubmissions);
        return self.submissionsNum < num;
      } else {
        return true;
      }
    },

    get serializableValue() {
      return { text: self.selectedValues() };
    },

    selectedValues() {
      return self.regions.map(r => r._value);
    },
  }))
  .actions(self => ({
    getSerializableValue() {
      const texts = self.regions.map(s => s._value);
      if (texts.length === 0) return;

      return { text: texts };
    },

    requiredModal() {
      InfoModal.warning(self.requiredmessage || `Input for the textarea "${self.name}" is required.`);
    },

    setValue(value) {
      self._value = value;
    },

    copyState(obj) {
      self.regions = obj.regions.map(r => cloneNode(r));
    },

    perRegionCleanup() {
      self.regions = [];
    },

    createRegion(text, pid) {
      const r = TextAreaRegionModel.create({ pid: pid, _value: text });
      self.regions.push(r);

      return r;
    },

    addText(text, pid) {
      const r = self.createRegion(text, pid);

      if (self.perregion) {
        const reg = self.completion.highlightedNode;
        reg && reg.updateOrAddState(self);
      } else {
        self.completion.addRegion(r);
      }

      return r;
    },

    beforeSend() {
      if (self._value && self._value.length) {
        self.addText(self._value);
        self._value = "";
      }
    },

    deleteText(text) {
      destroy(text);
    },

    onShortcut(value) {
      self.setValue(self._value + value);
    },

    toStateJSON() {
      if (!self.regions.length) return;

      const toname = self.toname || self.name;
      const tree = {
        id: self.pid,
        from_name: self.name,
        to_name: toname,
        type: "textarea",
        value: {
          text: self.regions.map(r => r._value),
        },
      };

      return tree;
    },

    fromStateJSON(obj, fromModel) {
      let { text } = obj.value;
      if (!Array.isArray(text)) text = [text];

      text.forEach(t => self.addText(t, obj.id));
    },
  }));

const TextAreaModel = types.compose(
  "TextAreaModel",
  ControlBase,
  TagAttrs,
  Model,
  ProcessAttrsMixin,
  RequiredMixin,
  PerRegionMixin,
);

const HtxTextArea = observer(({ item }) => {
  const rows = parseInt(item.rows);

  const props = {
    name: item.name,
    value: item._value,
    rows: item.rows,
    className: "is-search",
    label: item.label,
    placeholder: item.placeholder,
    onChange: ev => {
      const { value } = ev.target;
      item.setValue(value);
    },
  };

  if (!item.completion.editable) props["disabled"] = true;

  const region = item.completion.highlightedNode;

  const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };

  const showAddButton = item.completion.editable && (rows != 1 || item.showSubmitButton);
  const itemStyle = {};
  if (showAddButton) itemStyle["marginBottom"] = 0;

  visibleStyle["marginTop"] = "4px";

  return (
    <div style={visibleStyle}>
      {Tree.renderChildren(item)}

      {item.showSubmit && (
        <Form
          onFinish={ev => {
            if (item.allowsubmit && item._value) {
              item.addText(item._value);
              item.setValue("");
            }

            return false;
          }}
        >
          <Form.Item style={itemStyle}>
            {rows === 1 ? <Input {...props} /> : <TextArea {...props} />}
            {showAddButton && (
              <Form.Item>
                <Button style={{ marginTop: "10px" }} type="primary" htmlType="submit">
                  Add
                </Button>
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      )}

      {item.regions.length > 0 && (
        <div style={{ marginBottom: "1em" }}>
          {item.regions.map(t => (
            <HtxTextAreaRegion key={t.id} item={t} />
          ))}
        </div>
      )}
    </div>
  );
});

Registry.addTag("textarea", TextAreaModel, HtxTextArea);

export { TextAreaModel, HtxTextArea };

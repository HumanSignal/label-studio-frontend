import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { Form, Input, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { observer } from "mobx-react";
import { types, destroy, isAlive } from "mobx-state-tree";

import ProcessAttrsMixin from "../../../mixins/ProcessAttrs";
import RequiredMixin from "../../../mixins/Required";
import PerRegionMixin, { PER_REGION_MODES } from "../../../mixins/PerRegion";
import InfoModal from "../../../components/Infomodal/Infomodal";
import Registry from "../../../core/Registry";
import Tree from "../../../core/Tree";
import Types from "../../../core/Types";
import { HtxTextAreaRegion, TextAreaRegionModel } from "../../../regions/TextAreaRegion";
import { cloneNode } from "../../../core/Helpers";
import ControlBase from "../Base";
import { AnnotationMixin } from "../../../mixins/AnnotationMixin";
import styles from "../../../components/HtxTextBox/HtxTextBox.module.scss";
import { Block, Elem } from "../../../utils/bem";
import "./TextArea.styl";

const { TextArea } = Input;

/**
 * TextArea tag shows the textarea for user input
 * @example
 * <View>
 *   <TextArea name="ta"></TextArea>
 * </View>
 * @name TextArea
 * @param {string} name                    - Name of the element
 * @param {string} toName                  - Name of the element that you want to label
 * @param {string} value                   - Pre-filled value
 * @param {string=} [label]                - Label text
 * @param {string=} [placeholder]          - Placeholder text
 * @param {string=} [maxSubmissions]       - Maximum number of submissions
 * @param {boolean=} [editable=false]      - Editable textarea results
 * @param {boolean=} [transcription=false] - If false, always show editor
 * @param {number} [rows]                  - Number of rows in the textarea
 * @param {boolean} [required=false]       - Validate whether content in textarea is required
 * @param {string} [requiredMessage]       - Message to show if validation fails
 * @param {boolean=} [showSubmitButton]    - Whether to show or hide the submit button. By default it shows when there are more than one rows of text, such as in textarea mode.
 * @param {boolean} [perRegion]            - Use this tag to label regions instead of whole objects
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
  allowsubmit: types.optional(types.boolean, true),
  label: types.optional(types.string, ""),
  value: types.maybeNull(types.string),
  rows: types.optional(types.string, "1"),
  showsubmitbutton: types.optional(types.boolean, false),
  placeholder: types.maybeNull(types.string),
  maxsubmissions: types.maybeNull(types.string),
  editable: types.optional(types.boolean, false),
  transcription: false
});

const Model = types.model({
  type: "textarea",
  regions: types.array(TextAreaRegionModel),

  _value: types.optional(types.string, ""),
  children: Types.unionArray(["shortcut"]),

}).volatile(self => {
  return {
    focusable: true,
  };
}).views(self => ({
  get valueType() {
    return "text";
  },

  get holdsState() {
    return self.regions.length > 0;
  },

  get submissionsNum() {
    return self.regions.length;
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
    if (!self.regions.length) return null;
    return { text: self.selectedValues() };
  },

  selectedValues() {
    return self.regions.map(r => r._value);
  },

  get area() {
    if (self.perregion) {
      return self.annotation.highlightedNode;
    }
    return null;
  },

  get result() {
    return self.annotation.results.find(r => r.from_name === self && (!self.area || r.area === self.area));
  },
})).actions(self => ({
  getSerializableValue() {
    const texts = self.regions.map(s => s._value);
    if (texts.length === 0) return;

    return { text: texts };
  },

  needsUpdate() {
    self.updateFromResult(self.result?.mainValue);
  },

  requiredModal() {
    InfoModal.warning(self.requiredmessage || `Input for the textarea "${self.name}" is required.`);
  },

  setResult(value) {
    const values = Array.isArray(value) ? value : [value];
    values.forEach(v => self.createRegion(v));
  },

  updateFromResult(value) {
    self.regions = [];
    value && self.setResult(value);
  },

  setValue(value) {
    self._value = value;
  },

  remove(region) {
    const index = self.regions.indexOf(region);
    if (index < 0) return;
    self.regions.splice(index, 1);
    destroy(region);
    self.onChange();
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

  onChange() {
    if (self.result) {
      self.result.area.setValue(self);
    } else {
      if (self.perregion) {
        const area = self.annotation.highlightedNode;
        if (!area) return null;
        area.setValue(self);
      } else {
        self.annotation.createResult({}, { text: self.selectedValues() }, self, self.toname);
      }
    }
  },

  addText(text, pid) {
    self.createRegion(text, pid);
    self.onChange();
  },

  beforeSend() {
    if (self._value && self._value.length) {
      self.addText(self._value);
      self._value = "";
    }
  },

  // add unsubmitted text when user switches region
  submitChanges() {
    self.beforeSend();
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
  ProcessAttrsMixin,
  RequiredMixin,
  PerRegionMixin,
  AnnotationMixin,
  Model
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

  if (rows > 1) {
    // allow to add multiline text with shift+enter
    props.onKeyDown = e => {
      if (e.key === "Enter" && e.shiftKey && item.allowsubmit && item._value) {
        e.preventDefault();
        e.stopPropagation();
        item.addText(item._value);
        item.setValue("");
      }
    };
  }

  if (!item.annotation.editable) props["disabled"] = true;

  const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };

  const showAddButton = (item.annotation.editable && rows !== 1) || item.showSubmitButton;
  const itemStyle = {};
  if (showAddButton) itemStyle["marginBottom"] = 0;

  visibleStyle["marginTop"] = "4px";

  return (item.displaymode === PER_REGION_MODES.TAG ?
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
            <HtxTextAreaRegion key={t.id} item={t}/>
          ))}
        </div>
      )}
    </div> : null
  );
});

const HtxTextAreaResultLine = forwardRef(({ idx, value, onChange, onDelete, onFocus, control }, ref) => {
  const rows = parseInt(control.rows);
  const isTextarea = rows > 1;
  const inputRef = useRef();

  const inputProps = {
    ref: inputRef,
    className: "ant-input " + styles.input,
    value,
    autoSize: isTextarea ? { minRows: 1 } : null,
    onChange: e => {
      onChange(idx, e.target.value);
    },
    onFocus,
  };
  if (isTextarea) {
    inputProps.onKeyDown = e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.target?.blur?.();
      }
    };
  }
  return <Elem name="item">
    <Elem name="input" tag={isTextarea ? TextArea : Input} {...inputProps} ref={ref}/>
    <Elem name="action" tag={Button} icon={<DeleteOutlined />} size="small" type="text" onClick={()=>{onDelete(idx);}}/>
  </Elem>;
});

const HtxTextAreaResult = observer(({ item, control, firstResultInputRef, onFocus }) => {
  const value = item.mainValue;
  const changeHandler = useCallback((idx, val) => {
    const newValue = value.toJSON();
    newValue.splice(idx, 1, val);
    item.setValue(newValue);
  }, [value]);
  const deleteHandler = useCallback((idx) => {
    const newValue = value.toJSON();
    newValue.splice(idx, 1);
    item.setValue(newValue);
  }, [value]);
  return value.map((line, idx) => {
    return <HtxTextAreaResultLine key={idx} idx={idx} value={line} onChange={changeHandler} onDelete={deleteHandler} control={control} ref={idx === 0 ? firstResultInputRef : null}
      onFocus={onFocus}/>;
  });
});

const HtxTextAreaRegionView = observer(({ item, area, collapsed, setCollapsed }) => {
  const rows = parseInt(item.rows);
  const isTextArea = rows > 1;
  const isActive = item.area === area;
  const shouldFocus = area.isCompleted && area.perRegionFocusTarget === item && area.perRegionFocusRequest;
  const value = isActive ? item._value : "";
  const result = area.results.find(r => r.from_name === item);

  const expand = useCallback(() => {
    if (collapsed) {
      setCollapsed(false);
    }
  }, [collapsed]);

  const submitValue = useCallback(() => {
    if (result) {
      const newValue = result.mainValue.toJSON();
      newValue.push(item._value);
      result.setValue(newValue);
      item.setValue("");
    } else {
      item.addText(item._value);
      item.setValue("");
    }
  }, [item, result]);

  const mainInputRef = useRef();
  const firstResultInputRef = useRef();
  const lastFocusRequest = useRef(0);
  useEffect(() => {
    if (isActive && shouldFocus && lastFocusRequest.current < area.perRegionFocusRequest) {
      (mainInputRef.current || firstResultInputRef.current)?.focus?.();
      lastFocusRequest.current = area.perRegionFocusRequest;
    }
  }, [isActive, shouldFocus]);

  useEffect(() => {
    if (collapsed && item._value) {
      submitValue();
    }
  }, [collapsed]);

  const props = {
    ref: mainInputRef,
    value: value,
    rows: item.rows,
    className: "is-search",
    label: item.label,
    placeholder: item.placeholder,
    autoSize: isTextArea ? { minRows: 1 } : null,
    onChange: ev => {
      const { value } = ev.target;
      item.setValue(value);
    },
    onFocus: ev => {
      if (!area.isSelected) {
        area.annotation.selectArea(area);
      }
    }
  };

  if (isTextArea) {
    // allow to add multiline text with shift+enter
    props.onKeyDown = e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (item.allowsubmit && item._value) {
          submitValue();
        } else {
          e.target?.blur?.();
        }
      }
    };
  }

  if (!item.annotation.editable) props["disabled"] = true;

  const showAddButton = (item.annotation.editable && rows !== 1) || item.showSubmitButton;
  const itemStyle = {};
  if (showAddButton) itemStyle["marginBottom"] = 0;

  const showSubmit = !result || !result?.mainValue?.length || !item.maxsubmissions && result.mainValue.length < parseInt(item.maxsubmissions);

  if (!isAlive(item) || !isAlive(area)) return null;
  return (
    <Block name="textarea-tag" mod={{ mode: item.mode }}>
      {showSubmit && (
        <Elem name="form"
          tag={Form} mod={{ hidden: collapsed }}
          onFinish={ev => {
            if (item.allowsubmit && item._value) {
              submitValue();
            }
            return false;
          }}
        >
          <Elem name="input" tag={isTextArea ? TextArea : Input} {...props} />
        </Elem>
      )}

      {result ? <HtxTextAreaResult control={item} item={result} firstResultInputRef={firstResultInputRef} onFocus={expand}/> : null}
    </Block>
  );
});

Registry.addTag("textarea", TextAreaModel, HtxTextArea);
Registry.addPerRegionView("textarea", PER_REGION_MODES.REGION_LIST, HtxTextAreaRegionView);

export { TextAreaModel, HtxTextArea };

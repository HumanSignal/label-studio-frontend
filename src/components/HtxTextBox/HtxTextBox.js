import React from "react";
import { Typography, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, EnterOutlined } from "@ant-design/icons";
import styles from "./HtxTextBox.module.scss";
import throttle from "lodash.throttle";

const { Paragraph } = Typography;

export class HtxTextBox extends React.Component {
  state = {
    editing: false,
    height: 0,
    value: this.props.text,
  };

  textRef = React.createRef();
  inputRef = React.createRef();

  startEditing = () => {
    const height = this.textRef.current?.parentNode.offsetHeight || 0;
    this.setState({ editing: true, height });

    // eslint-disable-next-line no-unused-expressions
    this.props.onStartEditing?.();

    setTimeout(this.focus);
  };

  focus = () => {
    const input = this.inputRef.current;
    if (input) input.selectionStart = this.state.value.length;
  };

  setEditing = editing => {
    this.setState({ editing });
  };

  setValue = value => {
    this.setState({ value });
  };

  cancel = () => {
    this.setValue(this.props.text);
    this.setEditing(false);
  };

  save = () => {
    this.props.onChange(this.state.value);
    this.setEditing(false);
  };

  updateHeight = throttle(() => {
    const borders = 2;
    const height = (this.inputRef.current?.scrollHeight || 0) + borders;
    if (height && height !== this.state.height) {
      this.setState({ height });
    }
  }, 100);

  renderEdit() {
    const { className = "", onChange, onDelete, text, rows = 1, onlyEdit, ...props } = this.props;
    const { height, value } = this.state;

    const inputProps = {
      className: "ant-input " + styles.input,
      style: height ? { height } : null,
      autoFocus: true,
      ref: this.inputRef,
      value,
      onBlur: this.save,
      onChange: e => {
        this.setValue(e.target.value);
        this.updateHeight();
      },
      onKeyDown: e => {
        const { key, shiftKey } = e;
        if (key === "Enter") {
          // for multiline textarea save only by shift+enter
          if (+rows === 1 || shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.save();
          }
        } else if (key === "Escape") {
          this.cancel();
        }
      },
    };

    this.updateHeight();

    return (
      <Paragraph {...props} className={className + " ant-typography-edit-content " + styles.editing}>
        {rows > 1 ? <textarea {...inputProps} /> : <input {...inputProps} />}
        {!onlyEdit && (
          <Tooltip title="Save: [shift+enter]">
            <EnterOutlined className={"ant-typography-edit-content-confirm " + styles.enter} onClick={this.save} />
          </Tooltip>
        )}
      </Paragraph>
    );
  }

  renderView() {
    const { onChange, onDelete, text, ...props } = this.props;

    return (
      <>
        <Paragraph {...props}>
          <span ref={this.textRef}>{text}</span>
          {onChange && <EditOutlined onClick={this.startEditing} className="ant-typography-edit" />}
        </Paragraph>
        {onDelete && <DeleteOutlined className={styles.delete} onClick={onDelete} />}
      </>
    );
  }

  render() {
    return this.state.editing || this.props.onlyEdit ? this.renderEdit() : this.renderView();
  }
}

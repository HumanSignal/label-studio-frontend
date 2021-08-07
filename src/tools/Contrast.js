import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import { ControlOutlined } from "@ant-design/icons";

import BaseTool from "./Base";
import Constants from "../core/Constants";
import SliderDropDownTool from "../components/Tools/SliderDropDown";
import ToolMixin from "../mixins/Tool";

import styles from "./Tools.module.scss";

const ToolView = observer(({ item }) => {
  return (
    <Fragment>
      <SliderDropDownTool
        default={Constants.CONTRAST_VALUE}
        value={item.contrast}
        max={Constants.CONTRAST_MAX}
        selected={item.selected}
        icon={<ControlOutlined />}
        onResetClick={() => {
          item.setStroke(Constants.CONTRAST_VALUE);
        }}
        onChange={val => {
          item.setStroke(val);
        }}
      />
      <span className={styles.tooltitle}>Contrast</span>
    </Fragment>
  );
});

const _Tool = types
  .model({
    contrast: types.optional(types.number, Constants.CONTRAST_VALUE),
  })
  .views(self => ({
    get viewClass () {
      return <ToolView item={self} />;
    },
  }))
  .actions(self => ({
    setStroke (val) {
      self.contrast = val;
      self.obj.setContrastGrade(val);
    },
  }));

const Contrast = types.compose(ToolMixin, BaseTool, _Tool);

export { Contrast };

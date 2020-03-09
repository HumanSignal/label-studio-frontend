import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import BasicToolView from "../components/Tools/Basic";
import Constants from "../core/Constants";
import SliderDropDownTool from "../components/Tools/SliderDropDown";
import ToolMixin from "../mixins/Tool";
import { guidGenerator, restoreNewsnapshot } from "../core/Helpers";

import styles from "./Tools.module.scss";

const ToolView = observer(({ item }) => {
  return (
    <Fragment>
      <SliderDropDownTool
        default={Constants.BRIGHTNESS_VALUE}
        value={item.brightness}
        max={Constants.BRIGHTNESS_MAX}
        selected={item.selected}
        icon={"setting"}
        onResetClick={ev => {
          item.setStroke(Constants.BRIGHTNESS_VALUE);
        }}
        onChange={val => {
          item.setStroke(val);
        }}
      />
      <span className={styles.tooltitle}>Brightness</span>
    </Fragment>
  );
});

const _Tool = types
  .model({
    brightness: types.optional(types.number, Constants.BRIGHTNESS_VALUE),
  })
  .views(self => ({
    get viewClass() {
      return <ToolView item={self} />;
    },
  }))
  .actions(self => ({
    setStroke(val) {
      self.brightness = val;
      self.obj.setBrightnessGrade(val);
    },
  }));

const Brightness = types.compose(ToolMixin, BaseTool, _Tool);

export { Brightness };

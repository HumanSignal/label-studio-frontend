import React, { useRef } from "react";
import { inject, observer } from "mobx-react";
import { types, getParentOfType } from "mobx-state-tree";

import { Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import WithStatesMixin from "../mixins/WithStates";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { TextAreaModel } from "../tags/control/TextArea";
import { guidGenerator } from "../core/Helpers";

import styles from "./TextAreaRegion/TextAreaRegion.module.scss";
import Hint from "../components/Hint/Hint";
import Hotkey from "../core/Hotkey";

const { Paragraph } = Typography;

const Model = types
  .model("TextAreaRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "textarearegion",

    _editable: types.optional(types.boolean, false),
    _value: types.string,
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, TextAreaModel);
    },
    get regionElement() {
      return document.querySelector(`#TextAreaRegion-${self.id}`);
    },
  }))
  .actions(self => ({
    setValue(val) {
      self._value = val;
      self._editable = false;
      self.parent.onChange();
    },

    onHotKey() {
      self._editable = true;
      return false;
    },

    reinitializeHotKey(hotkey_prefix, hotkey) {
      const keys = Hotkey.getKeys();
      if (hotkey.search("\\+") >= -1 && keys.includes(hotkey_prefix)) {
        Hotkey.removeKey(hotkey_prefix);
      }

      if (keys.includes(hotkey)) {
        Hotkey.removeKey(hotkey);
      }

      Hotkey.addKey(hotkey, this.onHotKey, "Edit the text area region");
    },
  }));

const TextAreaRegionModel = types.compose(
  "TextAreaRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
);

const HtxTextAreaRegionView = inject("store")(
  observer(({ index, itemsCount, item, hotkey, store }) => {
    const classes = [styles.mark];
    const params = {};
    const { parent } = item;
    const { relationMode } = item.completion;

    if (relationMode) {
      classes.push(styles.relation);
    }

    if (item.selected) {
      classes.push(styles.selected);
    } else if (item.highlighted) {
      classes.push(styles.highlighted);
    }

    if (parent.editable) {
      params["editable"] = {
        onChange: str => {
          item.setValue(str);
        },
        onStart: () => {
          item.onHotKey();
        },
      };
    }

    let divAttrs = {};
    if (!parent.perregion) {
      divAttrs = {
        onMouseOver: () => {
          if (relationMode) {
            item.setHighlight(true);
          }
        },
        onMouseOut: () => {
          /* range.setHighlight(false); */
          if (relationMode) {
            item.setHighlight(false);
          }
        },
      };
    }

    const hotkey_prefix = hotkey;
    if (itemsCount > 1) {
      hotkey += "+" + (index + 1);
    }

    params["editable"]["icon"] = (
      <div>
        <EditOutlined />
        {store.settings.enableTooltips && store.settings.enableHotkeys && hotkey && <Hint>[{hotkey}]</Hint>}
      </div>
    );

    params["editable"]["editing"] = item._editable;

    item.reinitializeHotKey(hotkey_prefix, hotkey);

    return (
      <div {...divAttrs} className={styles.row} data-testid="textarea-region">
        <Paragraph id={`TextAreaRegion-${item.id}`} className={classes.join(" ")} {...params}>
          {item._value}
        </Paragraph>
        {parent.perregion && <DeleteOutlined className={styles.delete} onClick={() => item.parent.remove(item)} />}
      </div>
    );
  }),
);

const HtxTextAreaRegion = observer(HtxTextAreaRegionView);

Registry.addTag("textarearegion", TextAreaRegionModel, HtxTextAreaRegion);

export { TextAreaRegionModel, HtxTextAreaRegion };

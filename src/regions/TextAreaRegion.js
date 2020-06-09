import React from "react";
import { observer, inject } from "mobx-react";
import { types, getParentOfType } from "mobx-state-tree";

import { DeleteOutlined } from "@ant-design/icons";

import WithStatesMixin from "../mixins/WithStates";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { TextAreaModel } from "../tags/control/TextArea";
import { guidGenerator } from "../core/Helpers";

import styles from "./TextAreaRegion/TextAreaRegion.module.scss";

const Model = types
  .model("TextAreaRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "textarearegion",

    _value: types.string,
    // states: types.array(types.union(ChoicesModel)),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, TextAreaModel);
    },
  }))
  .actions(self => ({
    setValue(val) {
      self._value = val;
    },
  }));

const TextAreaRegionModel = types.compose(
  "TextAreaRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
);

const HtxTextAreaRegionView = ({ store, item }) => {
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

        // here we update the parent object's state
        if (parent.perregion) {
          const reg = item.completion.highlightedNode;
          reg && reg.updateSingleState(parent);

          // self.regions = [];
        }
      },
    };
  }

  let divAttrs = {};
  if (!parent.perregion) {
    divAttrs = {
      onClick: item.onClickRegion,
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

  return (
    <div {...divAttrs} className={styles.row} data-testid="textarea-region">
      <p className={classes.join(" ")} {...params}>
        {item._value}
      </p>
      {parent.perregion && (
        <DeleteOutlined
          className={styles.delete}
          onClick={ev => {
            const reg = item.completion.highlightedNode;
            item.completion.deleteRegion(item);

            reg && reg.updateSingleState(parent);

            ev.preventDefault();
            return false;
          }}
        />
      )}
    </div>
  );
};

const HtxTextAreaRegion = inject("store")(observer(HtxTextAreaRegionView));

Registry.addTag("textarearegion", TextAreaRegionModel, HtxTextAreaRegion);

export { TextAreaRegionModel, HtxTextAreaRegion };

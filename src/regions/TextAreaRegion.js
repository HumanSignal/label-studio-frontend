import React from "react";
import { observer } from "mobx-react";
import { types, getParentOfType } from "mobx-state-tree";

import WithStatesMixin from "../mixins/WithStates";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { TextAreaModel } from "../tags/control/TextArea";
import { guidGenerator } from "../core/Helpers";

import styles from "./TextAreaRegion/TextAreaRegion.module.scss";
import { HtxTextBox } from "../components/HtxTextBox/HtxTextBox";

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
    get regionElement() {
      return document.querySelector(`#TextAreaRegion-${self.id}`);
    },
  }))
  .actions(self => ({
    setValue(val) {
      self._value = val;
      self.parent.onChange();
    },
  }));

const TextAreaRegionModel = types.compose(
  "TextAreaRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
);

const HtxTextAreaRegionView = ({ item }) => {
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
    params.onChange = str => {
      item.setValue(str);
    };
  }

  params.onDelete = () => item.parent.remove(item);

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

  return (
    <div {...divAttrs} className={styles.row} data-testid="textarea-region">
      <HtxTextBox
        id={`TextAreaRegion-${item.id}`}
        className={classes.join(" ")}
        rows={parent.rows}
        text={item._value}
        {...params}
      />
    </div>
  );
};

const HtxTextAreaRegion = observer(HtxTextAreaRegionView);

Registry.addTag("textarearegion", TextAreaRegionModel, HtxTextAreaRegion);

export { TextAreaRegionModel, HtxTextAreaRegion };

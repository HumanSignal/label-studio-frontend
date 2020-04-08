import React from "react";
import { observer, inject } from "mobx-react";
import { types, getParent, getParentOfType, getRoot } from "mobx-state-tree";
import { Alert, Typography, Button } from "antd";

import { DeleteOutlined } from "@ant-design/icons";

import WithStatesMixin from "../mixins/WithStates";
import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { TextAreaModel } from "../tags/control/TextArea";
import { guidGenerator } from "../core/Helpers";

const { Paragraph } = Typography;

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
  let markStyle = {
    cursor: store.completionStore.selected.relationMode ? Constants.RELATION_MODE_CURSOR : Constants.POINTER_CURSOR,
    display: "block",
    marginBottom: "0.5em",

    backgroundColor: "#f6ffed",
    border: "1px solid #b7eb8f",

    borderRadius: "5px",
    padding: "0.4em",
    paddingLeft: "1em",
    paddingRight: "1em",
  };

  if (item.selected) {
    markStyle = {
      ...markStyle,
      border: "1px solid red",
    };
  } else if (item.highlighted) {
    markStyle = {
      ...markStyle,
      border: Constants.HIGHLIGHTED_CSS_BORDER,
    };
  }

  const params = {};
  const { parent } = item;
  if (parent.editable) {
    params["editable"] = {
      onChange: str => {
        item.setValue(str);

        // here we update the parent object's state
        if (parent.perregion) {
          const reg = parent.completion.highlightedNode;
          reg && reg.updateSingleState(parent);

          // self.regions = [];
        }
      },
    };
  }

  let divAttrs = {};
  if (!item.parent.perregion) {
    divAttrs = {
      onClick: item.onClickRegion,
      onMouseOver: () => {
        if (store.completionStore.selected.relationMode) {
          item.setHighlight(true);
        }
      },
      onMouseOut: () => {
        /* range.setHighlight(false); */
        if (store.completionStore.selected.relationMode) {
          item.setHighlight(false);
        }
      },
    };
  }

  return (
    <div {...divAttrs} style={{ display: "flex" }}>
      <div>
        <Paragraph style={markStyle} {...params}>
          {item._value}
        </Paragraph>
      </div>
      <div>
        {item.parent.perregion && (
          <div style={{ paddingTop: "0.5em", paddingLeft: "1em" }}>
            <a
              href=""
              onClick={ev => {
                const reg = item.completion.highlightedNode;
                item.completion.deleteRegion(item);

                reg && reg.updateSingleState(item.parent);

                ev.preventDefault();
                return false;
              }}
            >
              <DeleteOutlined />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const HtxTextAreaRegion = inject("store")(observer(HtxTextAreaRegionView));

Registry.addTag("textarearegion", TextAreaRegionModel, HtxTextAreaRegion);

export { TextAreaRegionModel, HtxTextAreaRegion };

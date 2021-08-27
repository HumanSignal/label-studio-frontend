import React from "react";
import arrayMove from "array-move";
import { List } from "antd";
import { SortableContainer, SortableElement, sortableHandle } from "react-sortable-hoc";
import { inject, observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import { guidGenerator } from "../../core/Helpers";

const RankerItemModel = types
  .model({
    backgroundColor: types.optional(types.string, "transparent"),
    value: types.maybeNull(types.string),
    _value: types.maybeNull(types.string),
    selected: types.optional(types.boolean, false),
    idx: types.number,
  })
  .actions(self => ({
    setBG(val) {
      self.backgroundColor = val;
    },

    setIdx(idx) {
      self.idx = idx;
    },

    setSelected(val) {
      self.selected = val;
    },
  }));

/**
 * Ranker tag, used for ranking models.
 *
 * Ranker has complex mechanics and uses only the "prediction" field from a labeling task. Please verify the information in the labeling task carefully.
 *
 * It renders a given list of strings and allows you to drag and reorder them.
 * To see this tag in action you have to import the example JSON below as a task on "Import" page. Save it as a file called example_ranker_tag.json, then upload it.
 * Set up a project with the given configuration and the example JSON file.
 *
 * @example
 * <View>
 *   <Text name="txt-1" value="$text"></Text>
 *   <Ranker name="ranker-1" toName="txt-1" ranked="true" sortedHighlightColor="red"></Ranker>
 * </View>
 * @example
 * [{
 *   "data": {
 *     "text": "Some text for the ranker tag"
 *   },
 *   "predictions": [{
 *     "model_version": "1564027355",
 *     "result": [{
 *       "from_name": "ranker-1",
 *       "to_name": "ranker-1",
 *       "type": "ranker",
 *       "value": {
 *         "items": ["abc", "def", "ghk", "more more more", "really long text"],
 *         "weights": [1.00, 0.78, 0.75, 0.74, 0.74],
 *         "selected": [false, false, false, false, false]
 *       }
 *     }],
 *     "score": 1.0
 *   }]
 * }]
 * @name Ranker
 * @meta_title Ranker Tags for Model Ranking
 * @meta_description Label Studio Ranker Tags customize Label Studio for model ranking for machine learning and data science projects.
 * @param {string} name                 - Name of group
 * @param {y|x=} [axis=y]               - Axis direction
 * @param {x|y} lockAxis                - Lock axis
 * @param {string} sortedHighlightColor - Sorted color
 */
const TagAttrs = types.model({
  axis: types.optional(types.enumeration(["x", "y"]), "y"),
  lockaxis: types.maybeNull(types.enumeration(["x", "y"])),

  // elementvalue: types.maybeNull(types.string),
  elementtag: types.optional(types.string, "Text"),
  ranked: types.optional(types.boolean, true),
  sortable: types.optional(types.boolean, true),

  sortedhighlightcolor: types.maybeNull(types.string),

  name: types.maybeNull(types.string),
  value: types.maybeNull(types.string),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    type: "ranker",
    update: types.optional(types.number, 1),

    regions: types.array(RankerItemModel),
    // update: types.optional(types.boolean, false)
  })
  .actions(self => ({
    setUpdate() {
      self.update = self.update + 1;
    },

    _addRegion(val, idx) {
      const reg = RankerItemModel.create({
        value: val,
        idx,
        _value: val,
      });

      self.regions.push(reg);
    },

    moveItems({ oldIndex, newIndex }) {
      if (oldIndex === newIndex) return;

      if (self.sortedhighlightcolor) {
        self.regions[oldIndex].setBG(self.sortedhighlightcolor);
      }

      self.regions[oldIndex].setSelected(true);

      if (self._value) self._value = arrayMove(self._value, oldIndex, newIndex);

      self.regions = arrayMove(self.regions, oldIndex, newIndex);
      self.setUpdate();
    },

    toStateJSON() {
      return {
        from_name: self.name,
        to_name: self.name,
        value: {
          // weights: ranked,
          items: self.regions.map(r => r.value),
          selected: self.regions.map(r => r.selected),
        },
      };
    },

    fromStateJSON(obj) {
      obj.value.items.forEach((v, idx) => {
        self._addRegion(v, idx);
      });

      self.setUpdate();
    },
  }));

const RankerModel = types.compose("RankerModel", TagAttrs, Model);

const DragHandle = sortableHandle(() => <div className="drag-handle"></div>);

function isMobileDevice() {
  try {
    return typeof window.orientation !== "undefined" || navigator.userAgent.indexOf("IEMobile") !== -1;
  } catch (e) {
    return false;
  }
}

const SortableText = SortableElement(({ item, value }) => {
  let classNames;

  if (isMobileDevice) {
    classNames = "noselect";
  }

  const map = {
    text: v => <span className={classNames}>{v._value}</span>,
    image: v => <img src={v._value} alt="" />,
    audio: v => <audio src={v._value} />,
  };

  return (
    <div
      style={{
        padding: "1em",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        background: value.selected ? item.sortedhighlightcolor : "transparent",
      }}
      className={classNames}
      onClick={ev => {
        if (value.selected) {
          value.setSelected(false);
          item.setUpdate();
        } else {
          value.setSelected(true);
          item.setUpdate();
        }
        ev.preventDefault();
        return false;
      }}
    >
      <DragHandle />
      {map[item.elementtag.toLowerCase()](value)}
    </div>
  );
});

const SortableList = SortableContainer(({ item, items }) => {
  return (
    <List celled>
      {items.map((value, index) => (
        <SortableText
          key={`item-${index}`}
          index={index}
          value={value}
          color={value.backgroundColor}
          item={item}
          onClick={() => {}}
        />
      ))}
    </List>
  );
});

const HtxRankerView = ({ item }) => {
  const props = {};

  if (isMobileDevice()) {
    props["pressDelay"] = 100;
  } else {
    props["distance"] = 7;
  }

  return (
    <div>
      <SortableList update={item.update} item={item} items={item.regions} onSortEnd={item.moveItems} {...props} />
    </div>
  );
};

const HtxRanker = inject("store")(observer(HtxRankerView));

Registry.addTag("ranker", RankerModel, HtxRanker);

export { RankerModel, HtxRanker };

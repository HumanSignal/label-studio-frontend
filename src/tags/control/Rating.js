import React from "react";
import { Rate } from "antd";
import { observer, inject } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";
import { StarOutlined } from "@ant-design/icons";

import RequiredMixin from "../../mixins/Required";
import PerRegionMixin from "../../mixins/PerRegion";
import Registry from "../../core/Registry";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * Rating adds rating selection
 *
 * @example
 * <View>
 *   <Text name="txt" value="$text" />
 *   <Rating name="rating" toName="txt" maxRating="10" icon="star" size="medium" />
 * </View>
 *
 * @name Rating
 * @param {string} name Name of the element
 * @param {string} toName Name of the element that you want to label
 * @param {number} [maxRating=5] Maximum rating value
 * @param {number} [defaultValue=0] Default rating value
 * @param {string} [size=medium] One of: small, medium, large
 * @param {string} [icon=start] One of: star, heart, fire, smile
 * @param {string} hotkey HotKey for changing rating value
 * @param {boolean} [required=false]   - validation if rating is required
 * @param {string} [requiredMessage]   - message to show if validation fails
 * @param {boolean} [perRegion] use this tag for region labeling instead of the whole object labeling
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),

  maxrating: types.optional(types.string, "5"),
  icon: types.optional(types.string, "star"),
  size: types.optional(types.string, "medium"),
  defaultvalue: types.optional(types.string, "0"),

  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "rating",
    rating: types.maybeNull(types.number),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },

    selectedValues() {
      return self.holdsState ? self.rating : null;
    },

    get holdsState() {
      return self.rating > 0;
    },
  }))
  .actions(self => ({
    getSelectedString() {
      return self.rating + " star";
    },

    copyState(obj) {
      self.setRating(obj.rating);
    },

    unselectAll() {
      self.rating = 0;
    },

    setRating(value) {
      self.rating = value;

      if (self.perregion) {
        const reg = self.completion.highlightedNode;
        reg && reg.updateOrAddState(self);
      }
    },

    increaseValue() {
      if (self.rating >= Number(self.maxrating)) {
        self.setRating(0);
      } else {
        if (self.rating > 0) {
          self.setRating(self.rating + 1);
        } else {
          self.setRating(1);
        }
      }
    },

    onHotKey() {
      return self.increaseValue();
    },

    toStateJSON() {
      if (self.rating) {
        const toname = self.toname || self.name;
        return {
          id: self.pid,
          from_name: self.name,
          to_name: toname,
          type: self.type,
          value: {
            rating: self.rating,
          },
        };
      }
    },

    fromStateJSON(obj, fromModel) {
      if (obj.id) self.pid = obj.id;

      self.rating = obj.value.rating;
    },
  }));

const RatingModel = types.compose("RatingModel", TagAttrs, Model, RequiredMixin, PerRegionMixin, ControlBase);

const HtxRating = inject("store")(
  observer(({ item, store }) => {
    let iconSize;

    if (item.size === "small") {
      iconSize = 15;
    } else if (item.size === "medium") {
      iconSize = 25;
    } else if (item.size === "large") {
      iconSize = 40;
    }

    const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };

    return (
      <div style={visibleStyle}>
        <Rate
          character={<StarOutlined style={{ fontSize: iconSize }} />}
          value={item.rating}
          count={Number(item.maxrating)}
          defaultValue={Number(item.defaultvalue)}
          onChange={item.setRating}
        />
        {store.settings.enableTooltips && store.settings.enableHotkeys && item.hotkey && (
          <sup style={{ fontSize: "9px" }}>[{item.hotkey}]</sup>
        )}
      </div>
    );
  }),
);

Registry.addTag("rating", RatingModel, HtxRating);

export { HtxRating, RatingModel };

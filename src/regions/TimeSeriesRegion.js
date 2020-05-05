import { types, getParentOfType, getRoot } from "mobx-state-tree";

import Hotkey from "../core/Hotkey";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import { TimeSeriesLabelsModel } from "../tags/control/TimeSeriesLabels";
import { TimeSeriesModel } from "../tags/object/TimeSeries";
import { guidGenerator } from "../core/Helpers";
import WithStatesMixin from "../mixins/WithStates";

const Model = types
  .model("TimeSeriesRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

    type: "timeseriesregion",

    start: types.number,
    end: types.number,
    instant: false,

    states: types.maybeNull(types.array(types.union(TimeSeriesLabelsModel))),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, TimeSeriesModel);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    growRight(size) {
      self.end = self.end + size;
    },

    growLeft(size) {
      self.start = self.start - size;
    },

    shrinkRight(size) {
      self.end = self.end - size;
    },

    shrinkLeft(size) {
      self.start = self.start + size;
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);

      const one = 1000;
      const lots = one * 10;

      Hotkey.addKey("left", () => self.growLeft(one), "Increase region to the left");
      Hotkey.addKey("right", () => self.growRight(one), "Increase region to the right");
      Hotkey.addKey("alt+left", () => self.shrinkLeft(one), "Decrease region on the left");
      Hotkey.addKey("alt+right", () => self.shrinkRight(one), "Decrease region on the right");

      Hotkey.addKey("shift+left", () => self.growLeft(lots));
      Hotkey.addKey("shift+right", () => self.growRight(lots));
      Hotkey.addKey("shift+alt+left", () => self.shrinkLeft(lots));
      Hotkey.addKey("shift+alt+right", () => self.shrinkRight(lots));

      self.completion.loadRegionState(self);
    },

    updateAppearenceFromState() {
      const s = self.labelsState;
      if (!s) return;

      self.parent.updateView();
    },

    /**
     * Unselect timeseries region
     */
    unselectRegion() {
      [
        "left",
        "right",
        "ctrl+left",
        "ctrl+right",
        "up",
        "shift+up",
        "down",
        "shift+down",
        "ctrl+up",
        "ctrl+shift+up",
        "ctrl+down",
        "ctrl+shift+down",
      ].forEach(key => Hotkey.removeKey(key));

      self.selected = false;
      self.completion.setHighlightedNode(null);
      self.completion.unloadRegionState(self);

      self.parent.updateView();
    },

    serialize(control, object) {
      let res = {
        value: {
          start: self.start,
          end: self.end,
          instant: self.instant,
        },
      };

      res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },
  }));

const TimeSeriesRegionModel = types.compose(
  "TimeSeriesRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
);

export { TimeSeriesRegionModel };

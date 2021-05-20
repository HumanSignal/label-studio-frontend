import * as d3 from "d3";
import { types, getRoot } from "mobx-state-tree";

import { Hotkey } from "../core/Hotkey";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import { TimeSeriesModel } from "../tags/object/TimeSeries";
import { guidGenerator } from "../core/Helpers";
import WithStatesMixin from "../mixins/WithStates";
import Registry from "../core/Registry";
import { AreaMixin } from "../mixins/AreaMixin";
import { AnnotationMixin } from "../mixins/AnnotationMixin";

const hotkeys = Hotkey("TimeSeries");

const Model = types
  .model("TimeSeriesRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "timeseriesregion",
    object: types.late(() => types.reference(TimeSeriesModel)),

    start: types.union(types.number, types.string),
    end: types.union(types.number, types.string),
    instant: false,
  })
  .views(self => ({
    get parent() {
      return self.object;
    },

    get regionElement() {
      return self._brushRef;
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
      const one = 1000;
      const lots = one * 10;

      hotkeys.addKey("left", () => self.growLeft(one), "Increase region to the left");
      hotkeys.addKey("right", () => self.growRight(one), "Increase region to the right");
      hotkeys.addKey("alt+left", () => self.shrinkLeft(one), "Decrease region on the left");
      hotkeys.addKey("alt+right", () => self.shrinkRight(one), "Decrease region on the right");

      hotkeys.addKey("shift+left", () => self.growLeft(lots));
      hotkeys.addKey("shift+right", () => self.growRight(lots));
      hotkeys.addKey("shift+alt+left", () => self.shrinkLeft(lots));
      hotkeys.addKey("shift+alt+right", () => self.shrinkRight(lots));

      self.parent.scrollToRegion(self);
    },

    updateAppearenceFromState() {
      const s = self.labelsState;
      if (!s) return;

      // @todo remove
      self.parent.updateView();
    },

    afterUnselectRegion() {
      hotkeys.unbindAll();

      self.parent.updateView();
    },

    updateRegion(start, end) {
      self.start = start;
      self.end = end;
    },

    afterCreate() {
      if (typeof self.start === "string") {
        // deal only with timestamps/indices
        self.start = self.parent.parseTime(self.start);
        self.end = self.parent.parseTime(self.end);
      }
    },

    serialize(control, object) {
      // convert to original format from data/csv
      const format = self.parent.timeformat ? d3.timeFormat(self.parent.timeformat) : Number;
      let res = {
        value: {
          start: format(self.start),
          end: format(self.end),
          instant: self.instant,
        },
      };

      return res;
    },
  }));

const TimeSeriesRegionModel = types.compose(
  "TimeSeriesRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
  AnnotationMixin,
);

Registry.addTag("timeseriesregion", TimeSeriesRegionModel, () => {});
Registry.addRegionType(TimeSeriesRegionModel, "timeseries");

export { TimeSeriesRegionModel };

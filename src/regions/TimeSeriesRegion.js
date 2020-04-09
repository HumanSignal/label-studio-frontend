import React from "react";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getRoot } from "mobx-state-tree";
import { Alert } from "antd";

import Constants from "../core/Constants";
import Hotkey from "../core/Hotkey";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
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
    moveLeft(size) {
      self.end = self.end - size;
      self.start = self.start - size;
    },

    moveRight(size) {
      self.end = self.end + size;
      self.start = self.start + size;
    },

    growRight(size) {
      self.end = self.end + size;
    },

    growLeft(size) {
      self.start = self.start + size;
    },

    shrinkRight(size) {
      self.end = self.end - size;
    },

    shrinkLeft(size) {
      self.start = self.start - size;
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);

      const def = 1000;
      const lots = def * 10;

      Hotkey.addKey("left", function() {
        self.moveLeft(def);
      });
      Hotkey.addKey("right", function() {
        self.moveRight(def);
      });
      Hotkey.addKey("ctrl+left", function() {
        self.moveLeft(lots);
      });
      Hotkey.addKey("ctrl+right", function() {
        self.moveRight(lots);
      });

      Hotkey.addKey("up", function() {
        self.growRight(def);
      });
      Hotkey.addKey("shift+up", function() {
        self.shrinkRight(def);
      });
      Hotkey.addKey("down", function() {
        self.growLeft(def);
      });
      Hotkey.addKey("shift+down", function() {
        self.shrinkLeft(def);
      });

      Hotkey.addKey("ctrl+up", function() {
        self.growRight(lots);
      });
      Hotkey.addKey("ctrl+shift+up", function() {
        self.shrinkRight(lots);
      });
      Hotkey.addKey("ctrl+down", function() {
        self.growLeft(lots);
      });
      Hotkey.addKey("ctrl+shift+down", function() {
        self.shrinkLeft(lots);
      });
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
      ].forEach(Hotkey.removeKey);

      self.selected = false;
      self.completion.setHighlightedNode(null);
      self.parent.updateView();
    },

    toStateJSON() {
      const parent = self.parent;
      const buildTree = obj => {
        const tree = {
          id: self.pid,
          from_name: obj.name,
          to_name: parent.name,
          source: parent.value,
          type: "tsregion",
          value: {
            start: self.start,
            end: self.end,
          },
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states.map(s => {
          const tree = buildTree(s);
          // in case of labels it's gonna be, labels: ["label1", "label2"]
          tree["value"][s.type] = s.getSelectedNames();
          tree["type"] = s.type;

          return tree;
        });
      } else {
        return buildTree(parent);
      }
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

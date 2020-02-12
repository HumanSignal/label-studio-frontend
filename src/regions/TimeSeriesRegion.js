import React from "react";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getRoot } from "mobx-state-tree";
import { Alert } from "antd";

import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import { TimeSeriesModel } from "../tags/object/TimeSeries";
import { guidGenerator } from "../core/Helpers";
import { TimeSeriesLabelsModel } from "../tags/control/TimeSeriesLabels";

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
    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);
    },

    /**
     * Unselect timeseries region
     */
    unselectRegion() {
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

const TimeSeriesRegionModel = types.compose("TimeSeriesRegionModel", RegionsMixin, NormalizationMixin, Model);

export { TimeSeriesRegionModel };

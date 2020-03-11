import { types, getRoot, getParentOfType } from "mobx-state-tree";

import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { HyperTextLabelsModel } from "../tags/control/HyperTextLabels";
import { HyperTextModel } from "../tags/object/HyperText";
import { guidGenerator } from "../core/Helpers";

const Model = types
  .model("HyperTextRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "hypertextregion",
    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,
    text: types.string,
    states: types.maybeNull(types.array(types.union(HyperTextLabelsModel))),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, HyperTextModel);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      Utils.HTML.removeSpans(self._spans);
    },

    serialize(control, object) {
      return {
        value: {
          start: self.start,
          end: self.end,
          text: self.text,
          startOffset: self.startOffset,
          endOffset: self.endOffset,
        },
      };
    },
  }));

const HyperTextRegionModel = types.compose(
  "HyperTextRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

export { HyperTextRegionModel };

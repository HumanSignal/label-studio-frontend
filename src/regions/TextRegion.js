import { types, getParentOfType, getRoot } from "mobx-state-tree";

import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { LabelsModel } from "../tags/control/Labels";
import { TextModel } from "../tags/object/Text";
import { guidGenerator } from "../core/Helpers";

const Model = types
  .model("TextRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "textrange",

    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,

    text: types.string,
    states: types.maybeNull(types.array(types.union(LabelsModel))),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, TextModel);
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
          start: self.startOffset,
          end: self.endOffset,
          text: self.text,
        },
      };
    },
  }));

const TextRegionModel = types.compose(
  "TextRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

export { TextRegionModel };

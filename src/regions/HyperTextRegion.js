import { types, getParentOfType } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { ChoicesModel } from "../tags/control/Choices";
import { HyperTextLabelsModel } from "../tags/control/HyperTextLabels";
import { HyperTextModel } from "../tags/object/HyperText";
import { RatingModel } from "../tags/control/Rating";
import { TextAreaModel } from "../tags/control/TextArea";
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
    states: types.maybeNull(types.array(types.union(HyperTextLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, HyperTextModel);
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      Utils.HTML.removeSpans(self._spans);
    },

    serialize(control, object) {
      let res = {
        value: {
          start: self.start,
          end: self.end,
          startOffset: self.startOffset,
          endOffset: self.endOffset,
        },
      };

      if (object.savetextresult === "yes") {
        res.value["text"] = self.text;
      }

      res.value = Object.assign(res.value, control.serializableValue);

      return res;
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

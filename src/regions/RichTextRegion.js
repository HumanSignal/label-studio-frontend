import { types, getParentOfType } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { ChoicesModel } from "../tags/control/Choices";
import { HyperTextLabelsModel } from "../tags/control/HyperTextLabels";
import { RatingModel } from "../tags/control/Rating";
import { TextAreaModel } from "../tags/control/TextArea";
import { guidGenerator } from "../core/Helpers";
import { RichTextModel } from "../tags/object";

const Model = types
  .model("RichTextRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "richtextregion",
    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,
    text: types.string,
    states: types.maybeNull(types.array(types.union(HyperTextLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, RichTextModel);
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

const RichTextRegionModel = types.compose(
  "RichTextRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

export { RichTextRegionModel };

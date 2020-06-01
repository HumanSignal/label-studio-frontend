import { types, getParentOfType, getRoot } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { LabelsModel } from "../tags/control/Labels";
import { ParagraphLabelsModel } from "../tags/control/ParagraphLabels";
import { TextAreaModel } from "../tags/control/TextArea";
import { ChoicesModel } from "../tags/control/Choices";
import { RatingModel } from "../tags/control/Rating";
import { ParagraphsModel } from "../tags/object/Paragraphs";
import { guidGenerator } from "../core/Helpers";

const Model = types
  .model("ParagraphsRegionModel", {
    type: "textrange",

    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,

    text: types.string,
    states: types.maybeNull(types.array(types.union(ParagraphLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, ParagraphsModel);
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      Utils.HTML.removeSpans(self._spans);
    },

    setParagraphs(text) {
      self.text = text;
    },

    serialize(control, object) {
      const re = /div\[([0-9]+)\]/;
      const start = self.start.match(re)[1];
      const end = self.end.match(re)[1];

      let res = {
        value: {
          start: start - 1,
          end: end - 1,
          // [TODO]
          // text: self.text,
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

const ParagraphsRegionModel = types.compose(
  "ParagraphsRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

export { ParagraphsRegionModel };

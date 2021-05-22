import { types } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { LabelsModel } from "../tags/control/Labels/Labels";
import { ParagraphLabelsModel } from "../tags/control/ParagraphLabels";
import { TextAreaModel } from "../tags/control/TextArea";
import { ChoicesModel } from "../tags/control/Choices";
import { RatingModel } from "../tags/control/Rating";
import { ParagraphsModel } from "../tags/object/Paragraphs";
import { AreaMixin } from "../mixins/AreaMixin";
import Registry from "../core/Registry";

const Model = types
  .model("ParagraphsRegionModel", {
    type: "textrange",
    object: types.late(() => types.reference(ParagraphsModel)),

    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,

    text: types.maybeNull(types.string),
    states: types.maybeNull(types.array(types.union(ParagraphLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),
  })
  .views(self => ({
    get parent() {
      return self.object;
    },
    get regionElement() {
      return self._spans?.[0];
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      Utils.HTML.removeSpans(self._spans);
    },

    setText(text) {
      self.text = text;
    },

    fixOffsets(startOffset, endOffset) {
      self.startOffset = startOffset;
      self.endOffset = endOffset;
    },

    serialize() {
      const { start, end } = self;

      let res = {
        value: {
          start,
          end,
          startOffset: self.startOffset,
          endOffset: self.endOffset,
        },
      };

      if (self.object.savetextresult === "yes") {
        res.value["text"] = self.text;
      }

      return res;
    },
  }));

const ParagraphsRegionModel = types.compose(
  "ParagraphsRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

Registry.addRegionType(ParagraphsRegionModel, "paragraphs");

export { ParagraphsRegionModel };

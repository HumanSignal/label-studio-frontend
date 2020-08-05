import { types, getParentOfType } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { LabelsModel } from "../tags/control/Labels";
import { TextAreaModel } from "../tags/control/TextArea";
import { ChoicesModel } from "../tags/control/Choices";
import { RatingModel } from "../tags/control/Rating";
import { TextModel } from "../tags/object/Text";
import { AreaMixin } from "../mixins/AreaMixin";

const Model = types
  .model("TextRegionModel", {
    type: "textrange",

    start: types.number,
    end: types.number,

    text: types.string,
  })
  .views(self => ({
    get parent() {
      return self.object;
    },
  }))
  .volatile(self => ({
    // @todo remove, it should be at least a view or maybe even not required at all
    states: [],
  }))
  .actions(self => ({
    beforeDestroy() {
      Utils.HTML.removeSpans(self._spans);
    },

    setText(text) {
      self.text = text;
    },

    serialize() {
      let res = {
        value: {
          start: self.start,
          end: self.end,
        },
      };

      if (self.object.savetextresult === "yes") {
        res.value["text"] = self.text;
      }

      // res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },
  }));

const TextRegionModel = types.compose(
  "TextRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

export { TextRegionModel };

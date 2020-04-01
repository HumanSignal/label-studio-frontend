import { types, getParentOfType, getRoot } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { LabelsModel } from "../tags/control/Labels";
import { TextAreaModel } from "../tags/control/TextArea";
import { ChoicesModel } from "../tags/control/Choices";
import { TextModel } from "../tags/object/Text";
import { guidGenerator } from "../core/Helpers";

const Model = types
  .model("TextRegionModel", {
    type: "textrange",

    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,

    text: types.string,
    states: types.maybeNull(types.array(types.union(LabelsModel, TextAreaModel, ChoicesModel))),
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
      let res = {
        value: {
          start: self.startOffset,
          end: self.endOffset,
          text: self.text,
        },
      };

      if (control.type === "labels") {
        res.value["labels"] = control.getSelectedNames();
      }

      if (control.type === "choices") {
        res.value["choices"] = control.getSelectedNames();
      }

      if (control.type === "textarea") {
        const texts = control.regions.map(s => s._value);
        if (texts.length === 0) return;

        res.value["text"] = texts;
      }

      return res;
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

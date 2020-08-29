import { types, getParentOfType } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import WithStatesMixin from "../mixins/WithStates";
import { ChoicesModel } from "../tags/control/Choices";
import { HyperTextLabelsModel } from "../tags/control/HyperTextLabels";
import { RatingModel } from "../tags/control/Rating";
import { TextAreaModel } from "../tags/control/TextArea";
import { guidGenerator } from "../core/Helpers";
import { RichTextModel } from "../tags/object";

import { HighlightMixin } from "../mixins/HighlightMixin";
import { LabelsModel } from "../tags/control/Labels";
import * as xpath from "xpath-range";

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
    states: types.maybeNull(
      types.array(types.union(LabelsModel, HyperTextLabelsModel, TextAreaModel, ChoicesModel, RatingModel)),
    ),
    isText: types.optional(types.boolean, false),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, RichTextModel);
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      self.removeHighlight();
    },

    serialize(control, object) {
      let res = {
        value: {},
      };

      if (self.isText) {
        Object.assign(res.value, {
          start: self.startOffset,
          end: self.endOffset,
        });
      } else {
        Object.assign(res.value, {
          start: self.start,
          end: self.end,
          startOffset: self.startOffset,
          endOffset: self.endOffset,
        });
      }

      if (object.savetextresult === "yes") {
        res.value["text"] = self.text;
      }

      res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },

    updateOffsets(startOffset, endOffset) {
      Object.assign(self, { startOffset, endOffset });
    },
  }));

const RichTextRegionModel = types.compose(
  "RichTextRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
  HighlightMixin,
);

export { RichTextRegionModel };

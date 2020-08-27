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
import { AreaMixin } from "../mixins/AreaMixin";
import Registry from "../core/Registry";

const Model = types
  .model("HyperTextRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "hypertextregion",
    object: types.late(() => types.reference(HyperTextModel)),

    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,
    text: types.string,
  })
  .volatile(self => ({
    // @todo remove, it should be at least a view or maybe even not required at all
    states: [],
  }))
  .views(self => ({
    get parent() {
      return self.object;
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      Utils.HTML.removeSpans(self._spans);
    },

    serialize() {
      let res = {
        value: {
          start: self.start,
          end: self.end,
          text: self.text,
          startOffset: self.startOffset,
          endOffset: self.endOffset,
        },
      };

      // res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },
  }));

const HyperTextRegionModel = types.compose(
  "HyperTextRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

Registry.addRegionType(HyperTextRegionModel, "hypertext");

export { HyperTextRegionModel };

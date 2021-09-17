import { types } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { TextModel } from "../tags/object/Text";
import { AreaMixin } from "../mixins/AreaMixin";
import Registry from "../core/Registry";

const Model = types
  .model("TextRegionModel", {
    type: "textrange",
    object: types.late(() => types.reference(TextModel)),

    start: types.number,
    end: types.number,

    text: "", // text is optional, for example in secureMode
  })
  .views(self => ({
    get parent() {
      return self.object;
    },
    getRegionElement() {
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

    /**
     * @example
     * {
     *   "value": {
     *     "start": 2,
     *     "end": 81,
     *     "labels": ["Car"]
     *   }
     * }
     * @typedef {Object} TextRegionResult
     * @property {Object} value
     * @property {string} value.start position of the start of the region in characters
     * @property {string} value.end position of the end of the region in characters
     * @property {string} [value.text] text content of the region, can be skipped
     */

    /**
     * @return {TextRegionResult}
     */
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

Registry.addRegionType(TextRegionModel, "text");

export { TextRegionModel };

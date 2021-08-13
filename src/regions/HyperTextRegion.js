import { types } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { HyperTextModel } from "../tags/object/HyperText";
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
     *     "start": "/div[1]/p[2]/text()[1]",
     *     "end": "/div[1]/p[4]/text()[3]",
     *     "startOffset": 2,
     *     "endOffset": 81,
     *     "hypertextlabels": ["Car"]
     *   }
     * }
     * @typedef {Object} HyperTextRegionResult
     * @property {Object} value
     * @property {string} value.start xpath of the container where the region starts (xpath)
     * @property {string} value.end xpath of the container where the region ends (xpath)
     * @property {number} value.startOffset offset inside start container
     * @property {number} value.endOffset offset inside end container
     * @property {string} [value.text] text content of the region, may be missed
     */

    /**
     * @return {HyperTextRegionResult}
     */
    serialize() {
      let res = {
        value: {
          start: self.start,
          end: self.end,
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

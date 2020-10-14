import { types } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import WithStatesMixin from "../mixins/WithStates";
import { guidGenerator } from "../core/Helpers";
import { RichTextModel } from "../tags/object/RichText/model";

import { HighlightMixin } from "../mixins/HighlightMixin";
import Registry from "../core/Registry";
import { AreaMixin } from "../mixins/AreaMixin";
import Utils from "../utils";

const Model = types
  .model("RichTextRegionModel", {
    type: "richtextregion",
    object: types.late(() => types.reference(RichTextModel)),

    startOffset: types.integer,
    endOffset: types.integer,
    start: types.string,
    end: types.string,
    text: types.string,
    isText: types.optional(types.boolean, false),
  })
  .views(self => ({
    get parent() {
      return self.object;
    },
    get regionElement() {
      return self._spans[0];
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

    _getRange() {
      if (self._cachedRegion === undefined) {
        return (self._cachedRegion = self._createNativeRange());
      }

      return self._cachedRegion;
    },

    _getRootNode() {
      return self.parent._rootNode;
    },

    _createNativeRange() {
      const rootNode = self._getRootNode();

      if (rootNode === undefined) return undefined;

      const { start, startOffset, end, endOffset } = self;

      try {
        if (self.isText) {
          const { startContainer, endContainer } = Utils.Selection.findRange(startOffset, endOffset, rootNode);
          const range = document.createRange();
          range.setStart(startContainer.node, startContainer.position);
          range.setEnd(endContainer.node, endContainer.position);
          return range;
        }

        return xpath.toRange(start, startOffset, end, endOffset, rootNode);
      } catch (err) {
        if (rootNode) console.log(err);
      }

      return undefined;
    },
  }));

const RichTextRegionModel = types.compose(
  "RichTextRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
  HighlightMixin,
);

Registry.addRegionType(RichTextRegionModel, "text");
Registry.addRegionType(RichTextRegionModel, "hypertext");
Registry.addRegionType(RichTextRegionModel, "richtext");

export { RichTextRegionModel };

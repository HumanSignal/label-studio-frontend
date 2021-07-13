import { types } from "mobx-state-tree";
import * as xpath from "xpath-range";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import WithStatesMixin from "../mixins/WithStates";
import { RichTextModel } from "../tags/object/RichText/model";

import { HighlightMixin } from "../mixins/HighlightMixin";
import Registry from "../core/Registry";
import { AreaMixin } from "../mixins/AreaMixin";
import Utils from "../utils";
import { isDefined } from "../utils/utilities";

const Model = types
  .model("RichTextRegionModel", {
    type: "richtextregion",
    object: types.late(() => types.reference(RichTextModel)),

    startOffset: types.integer,
    endOffset: types.integer,
    start: types.string,
    end: types.string,
    text: types.maybeNull(types.string),
    isText: types.optional(types.boolean, false),
  })
  .volatile((self) => ({
    hideable: true,
  }))
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
      try{
        self.removeHighlight();
      } catch(e) {}
    },

    serialize() {
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

      if (self.object.savetextresult === "yes" && isDefined(self.text)) {
        res.value["text"] = self.text;
      }

      return res;
    },

    updateOffsets(startOffset, endOffset) {
      Object.assign(self, { startOffset, endOffset });
    },

    _getRange() {
      const rootNode = self._getRootNode();

      if (self._cachedRegion === undefined || (rootNode && !rootNode.contains(self._cachedRegion.commonAncestorContainer))) {
        return (self._cachedRegion = self._createNativeRange());
      }

      return self._cachedRegion;
    },

    _getRootNode() {
      return self.parent.rootNodeRef.current;
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

          self.text = range.toString();

          return range;
        }

        return xpath.toRange(start, startOffset, end, endOffset, rootNode);
      } catch (err) {
        if (rootNode) console.log(err, rootNode, [startOffset, endOffset]);
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

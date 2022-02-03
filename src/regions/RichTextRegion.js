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
import { findRangeNative, rangeToGlobalOffset } from "../utils/selection-tools";

const GlobalOffsets = types.model("GlobalOffset", {
  start: types.number,
  end: types.number,
});

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
    globalOffsets: types.maybeNull(GlobalOffsets),
  })
  .volatile(() => ({
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
      } catch(e) {
        console.warn(e);
      }
    },

    serialize() {
      const res = {
        value: {},
      };

      if (self.isText) {
        Object.assign(res.value, {
          start: self.startOffset,
          end: self.endOffset,
        });
      } else {
        try {
          // Calculate proper XPath right before serialization
          const root = self._getRootNode(true);
          const range = findRangeNative(
            self.globalOffsets.start,
            self.globalOffsets.end,
            root,
          );

          if (!range) throw new Error;

          const xpathRange = xpath.fromRange(range, root);

          Object.assign(res.value, {
            ...xpathRange,
            globalOffsets: self.globalOffsets?.toJSON(),
          });
        } catch(e) {
          // regions may be broken, so they don't have globalOffsets
          // or they can't be applied on current html, so just keep them untouched
          const { start, end, startOffset, endOffset } = self;

          Object.assign(res.value, { start, end, startOffset, endOffset });

          if (self.globalOffsets) {
            Object.assign(res.value, {
              globalOffsets: self.globalOffsets?.toJSON(),
            });
          }
        }
      }

      if (self.object.savetextresult === "yes" && isDefined(self.text)) {
        res.value["text"] = self.text;
      }

      return res;
    },

    updateOffsets(startOffset, endOffset) {
      Object.assign(self, { startOffset, endOffset });
    },

    updateGlobalOffsets(start, end) {
      self.globalOffsets = GlobalOffsets.create({
        start,
        end,
      });
    },

    /**
     * @todo just use offsets here
     * Main method to get HTML range for LSF region
     * globalOffsets are only for end users convenience and for emergencies (xpath invalid)
     * @param {boolean} useOriginalContent
     */
    getRange() {
      const root = self._getRootNode();
      let range;

      // 0. Text regions are simple — just get range by offsets
      if (self.isText) {
        return findRangeNative(self.startOffset, self.endOffset, root);
      }

      // 1. first try to find range by xpath in original document
      range = self._getRange({ useOriginalContent: true });

      if (range) {
        // we need this range in the visible document, so find it by global offsets
        const originalRoot = self._getRootNode(true);
        const [soff, eoff] = rangeToGlobalOffset(range, originalRoot);

        return findRangeNative(soff, eoff, root);
      }

      // 2. then try to find range on visible document
      // that's for old buggy annotations created over dirty document state
      range = self._getRange({ useOriginalContent: false });

      if (range) {
        // @todo is it good to fix xpath here?
        // self._fixXPaths(range, root);
        return range;
      }

      // 3. if xpaths are broken use globalOffsets if given
      if (self.globalOffsets && isDefined(root)) {
        return findRangeNative(self.globalOffsets.start, self.globalOffsets.end, root);
      }

      // 4. out of options — region is broken
      return undefined;
    },

    // For external XPath updates
    _fixXPaths() {
      if (self.isText) return;

      const range = self._getRange(true);

      if (range && self.globalOffsets) {
        const root = self._getRootNode(true);

        const rangeFromGlobal = findRangeNative(
          self.globalOffsets.start,
          self.globalOffsets.end,
          root,
        );

        if (!rangeFromGlobal) return;

        const normedRange = xpath.fromRange(rangeFromGlobal, root);

        if (!isDefined(normedRange)) return;

        self.start = normedRange.start ?? self.start;
        self.end = normedRange.end ?? self.end;
        self.startOffset = normedRange.startOffset ?? self.startOffset;
        self.endOffset = normedRange.endOffset ?? self.endOffset;
      }
    },

    _getRange({ useOriginalContent = false, useCache = true } = {}) {
      const rootNode = self._getRootNode(useOriginalContent);
      const hasCache = isDefined(self._cachedRange) && !useOriginalContent && useCache;
      const rootNodeExists = hasCache && (rootNode && !rootNode.contains(self._cachedRange.commonAncestorContainer));

      if (hasCache === false || rootNodeExists) {
        const foundRange = self._createNativeRange(useOriginalContent);

        // Skip cache for original content tag
        if (useOriginalContent || useCache === false) return foundRange;

        return (self._cachedRange = foundRange);
      }

      return self._cachedRange;
    },

    _getRootNode(originalContent = false) {
      const ref = originalContent
        ? self.parent.originalContentRef
        : self.parent.rootNodeRef;
      const node = ref.current;

      return node?.contentDocument?.body ?? node;
    },

    _createNativeRange(useOriginalContent = false) {
      const rootNode = self._getRootNode(useOriginalContent);

      if (rootNode === undefined) return undefined;

      const { start, startOffset, end, endOffset } = self;

      try {
        return xpath.toRange(start, startOffset, end, endOffset, rootNode);
      } catch (err) {
        // actually this happens when regions cannot be located by xpath for some reason
        console.log("can't locate xpath", err);
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

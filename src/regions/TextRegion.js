import React from "react";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getRoot } from "mobx-state-tree";

import Constants from "../core/Constants";
import Hint from "../components/Hint/Hint";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import WithStatesMixin from "../mixins/WithStates";
import Registry from "../core/Registry";
import Utils from "../utils";
import styles from "./TextRegion/TextRegion.module.scss";
import { LabelsModel } from "../tags/control/Labels";
import { RatingModel } from "../tags/control/Rating";
import { TextModel } from "../tags/object/Text";
import { guidGenerator } from "../core/Helpers";
import { highlightRange, splitBoundaries } from "../utils/html";
import SpanTextMixin from "../mixins/SpanText";

const Model = types
  .model("TextRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "textrange",

    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,

    text: types.string,
    states: types.maybeNull(types.array(types.union(LabelsModel))),
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
      var norm = [];
      if (self._spans) {
        self._spans.forEach(span => {
          while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);

          norm.push(span.parentNode);
          span.parentNode.removeChild(span);
        });
      }

      norm.forEach(n => n.normalize());
    },

    /**
     *
     */
    toStateJSON() {
      const parent = self.parent;
      const buildTree = obj => {
        const tree = {
          id: self.pid,
          from_name: obj.name,
          to_name: parent.name,
          source: parent.value,
          type: "region",
          value: {
            start: self.startOffset,
            end: self.endOffset,
            text: self.text,
          },
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states.map(s => {
          const tree = buildTree(s);
          // in case of labels it's gonna be, labels: ["label1", "label2"]
          tree["value"][s.type] = s.getSelectedNames();
          tree["type"] = s.type;

          return tree;
        });
      } else {
        return buildTree(parent);
      }
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

import { types, getParentOfType, getRoot } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import SpanTextMixin from "../mixins/SpanText";
import Utils from "../utils";
import WithStatesMixin from "../mixins/WithStates";
import { LabelsModel } from "../tags/control/Labels";
import { HyperTextLabelsModel } from "../tags/control/HyperTextLabels";
import { TextAreaModel } from "../tags/control/TextArea";
import { ChoicesModel } from "../tags/control/Choices";
import { RatingModel } from "../tags/control/Rating";
import { ParagraphsModel } from "../tags/object/Paragraphs";
import { guidGenerator } from "../core/Helpers";

const Model = types
  .model("ParagraphsRegionModel", {
    type: "textrange",

    startOffset: types.integer,
    start: types.string,
    endOffset: types.integer,
    end: types.string,

    text: types.string,
    states: types.maybeNull(types.array(types.union(HyperTextLabelsModel, TextAreaModel, ChoicesModel, RatingModel))),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, ParagraphsModel);
    },
  }))
  .actions(self => ({
    beforeDestroy() {
      Utils.HTML.removeSpans(self._spans);
    },

    setParagraphs(text) {
      self.text = text;
    },

    serialize(control, object) {
      const re = /div\[([0-9]+)\]/;
      const start = self.start.match(re)[1];
      const end = self.end.match(re)[1];

      let res = {
        value: {
          start: start - 1,
          end: end - 1,
          // [TODO]
          // text: self.text,
          startOffset: self.startOffset,
          endOffset: self.endOffset,
        },
      };

      if (object.savetextresult === "yes") {
        res.value["text"] = self.text;
      }

      // TODO
      let val = control.serializableValue;
      if ("hypertextlabels" in val) val = { paragraphs: val["hypertextlabels"] };

      res.value = Object.assign(res.value, val);

      return res;
    },

    toStateJSON() {
      const parent = self.parent;

      // TODO

      const buildTree = control => {
        const type = control.type === "hypertextlabels" ? "paragraphs" : control.type;
        const tree = {
          id: self.pid,
          from_name: control.name,
          to_name: parent.name,
          source: parent.value,
          type: type,
        };

        if (self.normalization) tree["normalization"] = self.normalization;

        return tree;
      };

      if (self.states && self.states.length) {
        return self.states
          .map(s => {
            const ser = self.serialize(s, parent);
            if (!ser) return;

            const tree = {
              ...buildTree(s),
              ...ser,
            };

            // in case of labels it's gonna be, labels: ["label1", "label2"]

            return tree;
          })
          .filter(tree => tree);
      } else {
        const obj = self.completion.toNames.get(parent.name);
        const control = obj.length ? obj[0] : obj;

        const tree = {
          ...buildTree(control),
          ...self.serialize(control, parent),
        };

        return tree;
      }
    },
  }));

const ParagraphsRegionModel = types.compose(
  "ParagraphsRegionModel",
  WithStatesMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
  SpanTextMixin,
);

export { ParagraphsRegionModel };

import React from "react";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getRoot } from "mobx-state-tree";

import Constants from "../core/Constants";
import Hint from "../components/Hint/Hint";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Registry from "../core/Registry";
import Utils from "../utils";
import styles from "./TextRegion/TextRegion.module.scss";
import { LabelsModel } from "../tags/control/Labels";
import { RatingModel } from "../tags/control/Rating";
import { TextModel } from "../tags/object/Text";
import { guidGenerator } from "../core/Helpers";

const Model = types
  .model("TextRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "textrange",

    // start: types.integer,
    // end: types.integer,

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
    setHighlight(val) {
      self.highlighted = val;

      if (self._spans) {
        const len = self._spans.length;
        const fspan = self._spans[0];
        const lspan = self._spans[len - 1];
        const mspans = self._spans.slice(1, len - 2);

        const set = (span, s, { top = true, bottom = true, right = true, left = true } = {}) => {
          if (right) span.style.borderRight = s;
          if (left) span.style.borderLeft = s;
          if (top) span.style.borderTop = s;
          if (bottom) span.style.borderBottom = s;
        };

        if (self.highlighted) {
          const h = Constants.HIGHLIGHTED_CSS_BORDER;
          set(fspan, h, { right: false });
          set(lspan, h, { left: false });

          if (mspans.length) mspans.forEach(s => set(s, h, { top: false, bottom: false }));
        } else {
          const zpx = "0px";
          set(fspan, zpx);
          set(lspan, zpx);

          if (mspans.length) mspans.forEach(s => set(s, zpx, { top: false, bottom: false }));
        }
      }
    },

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

    updateAppearenceFromState() {
      const names = Utils.Checkers.flatten(self.states.map(s => s.getSelectedNames()));

      const hc = self.parent.highlightcolor;
      let labelColor =
        hc ||
        self.states.map(s => {
          return s.getSelectedColor();
        })[0];

      if (labelColor) {
        labelColor = Utils.Colors.convertToRGBA(labelColor, 0.3);
      }

      if (self._spans) {
        self._spans.forEach(span => {
          span.style.background = labelColor;
        });
      }

      let cssCls = "htx-label-" + names.join("-");
      cssCls = cssCls.toLowerCase();

      const lastSpan = self._lastSpan;

      lastSpan.className = "htx-highlight htx-highlight-last " + cssCls;

      Utils.HTML.createClass("." + cssCls + ":after", 'content:"' + "[" + names.join(",") + ']"');
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

const TextRegionModel = types.compose("TextRegionModel", RegionsMixin, NormalizationMixin, Model);

/**
 * Region state hint
 * @param {*} props
 */
const RegionState = props => {
  const localState = props.state;

  /**
   * Get name of label
   */
  const selectedString = localState.getSelectedString();
  const selectedColor = Utils.Colors.convertToRGBA(localState.getSelectedColor(), 0.3);
  let style = {
    background: selectedColor,
  };

  if (props.style) style = { ...style, outline: props.style.outline };

  return (
    <Hint className={styles.state} style={style}>
      <span data-hint={true}>&nbsp;[{selectedString}]</span>
    </Hint>
  );
};

const HtxTextRegionView = ({ store, item, letterGroup, range, textCharIndex, onMouseOverHighlightedWord }) => {
  /**
   * Get color of label
   */
  let labelColor = "rgba(0, 0, 255, 0.1)";

  if (range.states) {
    labelColor = range.states.map(s => {
      return s.getSelectedColor();
    });
  }

  /**
   * TODO
   * Update function to all formats
   */
  if (labelColor.length !== 0) {
    labelColor = Utils.Colors.convertToRGBA(labelColor[0], 0.3);
  }

  let markStyle = {
    padding: "2px 0px",
    position: "relative",
    borderRadius: "2px",
    cursor: store.completionStore.selected.relationMode ? Constants.RELATION_MODE_CURSOR : Constants.POINTER_CURSOR,
  };

  let regionStates = range.states.map(state => (
    <RegionState
      key={range.id}
      state={state}
      bg={labelColor}
      hover={store.completionStore.selected.relationMode ? true : false}
      selected={range.selected}
      style={range.highlighted ? { outline: Constants.HIGHLIGHTED_CSS_BORDER } : null}
    />
  ));

  /**
   * Without label
   */
  if (!regionStates.length) {
    markStyle = {
      ...markStyle,
      background: "rgba(0, 0, 255, 0.1)",
    };
  }

  return (
    <span
      style={markStyle}
      onClick={range.onClickRegion}
      onMouseOver={() => {
        if (store.completionStore.selected.relationMode) {
          range.setHighlight(true);
        }
      }}
      onMouseOut={() => {
        if (store.completionStore.selected.relationMode) {
          range.setHighlight(false);
        }
      }}
    >
      {letterGroup}
      {regionStates}
    </span>
  );
};

const HtxTextRegion = inject("store")(observer(HtxTextRegionView));

export { TextRegionModel, HtxTextRegion };

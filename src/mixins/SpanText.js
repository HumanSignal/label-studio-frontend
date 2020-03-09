import { types } from "mobx-state-tree";

import Utils from "../utils";
import Constants from "../core/Constants";
import { highlightRange, splitBoundaries } from "../utils/html";

export default types
  .model()
  .views(self => ({}))
  .actions(self => ({
    updateSpansColor(bgcolor, opacity) {
      if (self._spans) {
        self._spans.forEach(span => {
          if (bgcolor) {
            span.style.backgroundColor = bgcolor;
          }

          if (opacity) {
            span.style.backgroundColor = Utils.Colors.rgbaChangeAlpha(span.style.backgroundColor, opacity);
          }
        });
      }
    },

    updateAppearenceFromState() {
      const labelColor = self.getLabelColor();

      self.updateSpansColor(labelColor);
      self.applyCSSClass(self._lastSpan);
    },

    createSpans() {
      const labelColor = self.getLabelColor();
      const spans = highlightRange(self, "htx-highlight", { backgroundColor: labelColor });

      const lastSpan = spans[spans.length - 1];
      if (!lastSpan) return;

      self.applyCSSClass(lastSpan);

      self._lastSpan = lastSpan;
      self._spans = spans;

      return spans;
    },

    getLabelColor() {
      let labelColor = self.parent.highlightcolor || self.states.map(s => s.getSelectedColor())[0];

      if (labelColor) {
        labelColor = Utils.Colors.convertToRGBA(labelColor, 0.3);
      }

      return labelColor;
    },

    applyCSSClass(lastSpan) {
      const names = Utils.Checkers.flatten(self.states.map(s => s.getSelectedNames()));
      const clsName = Utils.Checkers.hashCode(names.join("-"));

      let cssCls = "htx-label-" + clsName;
      cssCls = cssCls.toLowerCase();

      if (self.parent.showlabels === true)
        Utils.HTML.createClass("." + cssCls + ":after", 'content:"' + "[" + names.join(",") + ']"');

      lastSpan.className = "htx-highlight htx-highlight-last " + cssCls;
    },

    addEventsToSpans(spans) {
      const addEvent = s => {
        s.onmouseover = function() {
          if (self.completion.relationMode) {
            self.toggleHighlight();
            s.style.cursor = Constants.RELATION_MODE_CURSOR;
          } else {
            s.style.cursor = Constants.POINTER_CURSOR;
          }
        };

        s.onmouseout = function() {
          self.setHighlight(false);
          s.style.cursor = Constants.DEFAULT_CURSOR;
        };

        s.onclick = function(ev) {
          if (ev.doSelection) return;
          self.onClickRegion();
        };

        s.mouseover = function() {
          this.style.cursor = "pointer";
        };

        return false;
      };

      spans && spans.forEach(s => addEvent(s));
    },

    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);
      self.updateSpansColor(null, 0.8);
      self.completion.loadRegionState(self);
    },

    /**
     * Unselect audio region
     */
    unselectRegion() {
      self.selected = false;
      self.completion.setHighlightedNode(null);
      self.updateSpansColor(null, 0.3);
      self.completion.unloadRegionState(self);
    },

    setHighlight(val) {
      self.highlighted = val;

      if (self._spans) {
        const len = self._spans.length;
        const fspan = self._spans[0];
        const lspan = self._spans[len - 1];
        const mspans = self._spans.slice(1, len - 1);

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

          if (mspans.length) mspans.forEach(s => set(s, h, { left: false, right: false }));
        } else {
          const zpx = "0px";
          set(fspan, zpx);
          set(lspan, zpx);

          if (mspans.length) mspans.forEach(s => set(s, zpx, { left: false, right: false }));
        }
      }
    },
  }));

import { getRoot, types } from "mobx-state-tree";

import WithStatesMixin from "../mixins/WithStates";
import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Utils from "../utils";
import { AudioPlusModel } from "../tags/object/AudioPlus";
import { AreaMixin } from "../mixins/AreaMixin";
import Registry from "../core/Registry";

const Model = types
  .model("AudioRegionModel", {
    type: "audioregion",
    object: types.late(() => types.reference(AudioPlusModel)),

    start: types.number,
    end: types.number,

    selectedregionbg: types.optional(types.string, "rgba(0, 0, 0, 0.5)"),
  })
  .volatile(() => ({
    hideable: true,
  }))
  .views(self => ({
    getRegionElement() {
      return self.wsRegionElement(self._ws_region);
    },

    wsRegionElement(wsRegion) {
      const elID = wsRegion.id;
      let el = document.querySelector(`[data-id="${elID}"]`);

      return el;
    },

    get wsRegionOptions() {
      const reg = {
        id: self.id,
        start: self.start,
        end: self.end,
        color: "orange",
      };

      if (self.readonly) {
        reg.drag = false;
        reg.resize = false;
      }
      return reg;
    },
  }))
  .actions(self => ({
    /**
     * @example
     * {
     *   "original_length": 18,
     *   "value": {
     *     "start": 3.1,
     *     "end": 8.2,
     *     "labels": ["Voice"]
     *   }
     * }
     * @typedef {Object} AudioRegionResult
     * @property {number} original_length length of the original audio (seconds)
     * @property {Object} value
     * @property {number} value.start start time of the fragment (seconds)
     * @property {number} value.end end time of the fragment (seconds)
     */

    /**
     * @returns {AudioRegionResult}
     */
    serialize() {
      let res = {
        original_length: self.object._ws?.getDuration(),
        value: {
          start: self.start,
          end: self.end,
        },
      };

      return res;
    },

    updateColor(alpha = 1) {
      const color = Utils.Colors.convertToRGBA(self.getOneColor(), alpha);
      // eslint-disable-next-line no-unused-expressions

      self._ws_region?.update({ color });
    },

    updateAppearenceFromState() {
      if (self._ws_region?.update) {
        self.applyCSSClass(self._ws_region);
      }
    },

    applyCSSClass(wsRegion) {
      self.updateColor(0.3);

      const settings = getRoot(self).settings;
      const el = self.wsRegionElement(wsRegion);

      if (!el) return;
      const classes = [el.className, "htx-highlight", "htx-highlight-last"];

      if (!self.parent.showlabels && !settings.showLabels) {
        classes.push("htx-no-label");
      } else {
        const cssCls = Utils.HTML.labelWithCSS(el, {
          labels: self.labeling?.mainValue,
          score: self.score,
        });

        classes.push(cssCls);
      }
      el.className = classes.filter(Boolean).join(" ");
    },

    /**
     * Select audio region
     */
    selectRegion() {
      self.updateColor(0.8);

      const el = self.wsRegionElement(self._ws_region);

      if (el) {
        // scroll object tag but don't scroll the document
        const container = window.document.scrollingElement;
        const top = container.scrollTop;
        const left = container.scrollLeft;

        el.scrollIntoViewIfNeeded ? el.scrollIntoViewIfNeeded() : el.scrollIntoView();
        window.document.scrollingElement.scrollTo(left, top);
      }
    },

    /**
     * Unselect audio region
     */
    afterUnselectRegion() {
      self.updateColor(0.3);
    },

    setHighlight(val) {
      self._highlighted = val;

      if (val) {
        self.updateColor(0.8);
        self._ws_region.element.style.border = Constants.HIGHLIGHTED_CSS_BORDER;
      } else {
        self.updateColor(0.3);
        self._ws_region.element.style.border = "none";
      }
    },

    beforeDestroy() {
      if (self._ws_region) self._ws_region.remove();
    },

    onClick(wavesurfer, ev) {
      // if (! self.editable) return;

      if (!self.annotation.relationMode) {
        // Object.values(wavesurfer.regions.list).forEach(r => {
        //   // r.update({ color: self.selectedregionbg });
        // });

        self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
      }

      self.onClickRegion(ev);
    },

    onMouseOver() {
      if (self.annotation.relationMode) {
        self.setHighlight(true);
        self._ws_region.element.style.cursor = Constants.RELATION_MODE_CURSOR;
      }
    },

    onMouseLeave() {
      if (self.annotation.relationMode) {
        self.setHighlight(false);
        self._ws_region.element.style.cursor = Constants.MOVE_CURSOR;
      }
    },

    onUpdateEnd() {
      self.start = self._ws_region.start;
      self.end = self._ws_region.end;
      self.updateColor(self.selected ? 0.8 : 0.3);
      self.notifyDrawingFinished();
    },

    toggleHidden(e) {
      self.hidden = !self.hidden;
      self._ws_region.element.style.display = self.hidden ?  "none" : "block";
      e?.stopPropagation();
    },
  }));

const AudioRegionModel = types.compose(
  "AudioRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
);

Registry.addRegionType(AudioRegionModel, "audioplus");

export { AudioRegionModel };

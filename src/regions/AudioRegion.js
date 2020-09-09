import { types, getParentOfType, getRoot } from "mobx-state-tree";

import WithStatesMixin from "../mixins/WithStates";
import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Utils from "../utils";
import { AudioPlusModel } from "../tags/object/AudioPlus";
import { TextAreaModel } from "../tags/control/TextArea";
import { ChoicesModel } from "../tags/control/Choices";
import { LabelsModel } from "../tags/control/Labels";
import { guidGenerator } from "../core/Helpers";
import { RatingModel } from "../tags/control/Rating";
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
  .views(self => ({
    wsRegionElement(wsRegion) {
      const elID = wsRegion.id;
      let el = Array.from(document.querySelectorAll(`[data-id="${elID}"]`));

      if (el && el.length) el = el[0];
      return el;
    },
  }))
  .actions(self => ({
    serialize() {
      let res = {
        original_length: self.object._ws.getDuration(),
        value: {
          start: self.start,
          end: self.end,
        },
      };

      // res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },

    updateColor(alpha = 1) {
      const color = Utils.Colors.convertToRGBA(self.style?.fillcolor, alpha);
      // eslint-disable-next-line no-unused-expressions
      self._ws_region?.update({ color });
    },

    updateAppearenceFromState() {
      // const s = self.labelsState;
      // if (!s) return;

      // self.selectedregionbg = Utils.Colors.convertToRGBA("rgb(255, 125, 0)", 0.3);
      if (self._ws_region?.update) {
        self.applyCSSClass(self._ws_region);
        // self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
      }
    },

    applyCSSClass(wsRegion) {
      self.updateColor(0.3);
      return;
      const el = self.wsRegionElement(wsRegion);

      const settings = getRoot(self).settings;
      const names = Utils.Checkers.flatten(self.states.filter(s => s._type === "labels").map(s => s.selectedValues()));

      const cssCls = Utils.HTML.labelWithCSS(el, {
        labels: names,
        score: self.score,
      });

      // @todo show labels on audio regions
      const classes = [el.className, "htx-highlight", "htx-highlight-last", cssCls];

      if (!self.parent.showlabels && !settings.showLabels) classes.push("htx-no-label");

      el.className = classes.filter(c => c).join(" ");
    },

    /**
     * Select audio region
     */
    selectRegion() {
      self.updateColor(0.8);

      const el = self.wsRegionElement(self._ws_region);
      if (el) {
        el.scrollIntoViewIfNeeded ? el.scrollIntoViewIfNeeded() : el.scrollIntoView();
      }

      return;
      self.selected = true;
      self.completion.setHighlightedNode(self);
      self._ws_region.update({
        color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8),
        // border: "1px dashed #00aeff"
      });
      self.completion.loadRegionState(self);

      // const el = self.wsRegionElement(self._ws_region);
      // if (el) {
      //   const container = window.document.scrollingElement;
      //   const top = container.scrollTop;
      //   const left = container.scrollLeft;
      //   el.scrollIntoViewIfNeeded ? el.scrollIntoViewIfNeeded() : el.scrollIntoView();
      //   window.document.scrollingElement.scrollTo(left, top);
      // }
    },

    /**
     * Unselect audio region
     */
    afterUnselectRegion() {
      self.updateColor(0.3);
    },

    setHighlight(val) {
      self.highlighted = val;

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

    onClick(wavesurfer) {
      // if (! self.editable) return;

      if (!self.completion.relationMode) {
        // Object.values(wavesurfer.regions.list).forEach(r => {
        //   // r.update({ color: self.selectedregionbg });
        // });

        self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
      }

      self.onClickRegion();
    },

    onMouseOver() {
      if (self.completion.relationMode) {
        self.setHighlight(true);
        self._ws_region.element.style.cursor = Constants.RELATION_MODE_CURSOR;
      }
    },

    onMouseLeave() {
      if (self.completion.relationMode) {
        self.setHighlight(false);
        self._ws_region.element.style.cursor = Constants.MOVE_CURSOR;
      }
    },

    onUpdateEnd(wavesurfer) {
      self.start = self._ws_region.start;
      self.end = self._ws_region.end;
      self.updateColor(self.selected ? 0.8 : 0.3);
    },
  }));

const AudioRegionModel = types.compose(
  "AudioRegionModel",
  WithStatesMixin,
  AreaMixin,
  RegionsMixin,
  NormalizationMixin,
  Model,
);

Registry.addRegionType(AudioRegionModel, "audioplus");

export { AudioRegionModel };

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
import Canvas from "../utils/canvas";
import { RatingModel } from "../tags/control/Rating";

const Model = types
  .model("AudioRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "audioregion",
    start: types.number,
    end: types.number,

    states: types.maybeNull(types.array(types.union(LabelsModel, TextAreaModel, ChoicesModel, RatingModel))),
    selectedregionbg: types.optional(types.string, "rgba(0, 0, 0, 0.5)"),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, AudioPlusModel);
    },

    wsRegionElement(wsRegion) {
      const elID = wsRegion.id;
      let el = Array.from(document.querySelectorAll(`[data-id="${elID}"]`));

      if (el && el.length) el = el[0];
      return el;
    },
  }))
  .actions(self => ({
    serialize(control, object) {
      let res = {
        original_length: object._ws.getDuration(),
        value: {
          start: self.start,
          end: self.end,
        },
      };

      res.value = Object.assign(res.value, control.serializableValue);

      return res;
    },

    updateAppearenceFromState() {
      const s = self.labelsState;
      if (!s) return;

      self.selectedregionbg = Utils.Colors.convertToRGBA(s.getSelectedColor(), 0.3);
      if (self._ws_region.update) {
        self.applyCSSClass(self._ws_region);
        self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
      }
    },

    applyCSSClass(wsRegion) {
      const el = self.wsRegionElement(wsRegion);

      const settings = getRoot(self).settings;
      const names = Utils.Checkers.flatten(self.states.filter(s => s._type === "labels").map(s => s.selectedValues()));

      const cssCls = Utils.HTML.labelWithCSS(el, {
        labels: names,
        score: self.score,
      });

      const classes = [el.className, "htx-highlight", "htx-highlight-last", cssCls];

      if (!self.parent.showlabels && !settings.showLabels) classes.push("htx-no-label");

      el.className = classes.filter(c => c).join(" ");
    },

    /**
     * Select audio region
     */
    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);
      self._ws_region.update({
        color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8),
        // border: "1px dashed #00aeff"
      });
      self.completion.loadRegionState(self);

      const el = self.wsRegionElement(self._ws_region);
      if (el) el.scrollIntoView();
    },

    /**
     * Unselect audio region
     */
    afterUnselectRegion() {
      // debugger;
      if (self._ws_region.update) {
        self._ws_region.update({
          color: self.selectedregionbg,
          // border: "none"
        });
      }
    },

    setHighlight(val) {
      self.highlighted = val;

      if (val) {
        self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
        self._ws_region.element.style.border = Constants.HIGHLIGHTED_CSS_BORDER;
      } else {
        self._ws_region.update({ color: self.selectedregionbg });
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
    },
  }));

const AudioRegionModel = types.compose("AudioRegionModel", WithStatesMixin, RegionsMixin, NormalizationMixin, Model);

export { AudioRegionModel };

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

const Model = types
  .model("AudioRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "audioregion",
    start: types.number,
    end: types.number,
    states: types.maybeNull(types.array(types.union(LabelsModel, TextAreaModel, ChoicesModel))),
    selectedregionbg: types.optional(types.string, "rgba(0, 0, 0, 0.5)"),
  })
  .views(self => ({
    get parent() {
      return getParentOfType(self, AudioPlusModel);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
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

      if (control.type === "labels") {
        res.value["labels"] = control.getSelectedNames();
      }

      if (control.type === "textarea") {
        const texts = control.regions.map(s => s._value);
        if (texts.length === 0) return;

        res.value["text"] = texts;
      }

      return res;
    },

    updateAppearenceFromState() {
      self.selectedregionbg = Utils.Colors.convertToRGBA(self.states[0].getSelectedColor(), 0.3);
      if (self._ws_region.update) {
        self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
      }
    },

    /**
     * Select audio region
     */
    selectRegion() {
      self.selected = true;
      self.completion.setHighlightedNode(self);
      self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
      self.completion.loadRegionState(self);
    },

    /**
     * Unselect audio region
     */
    unselectRegion() {
      self.selected = false;
      self.completion.setHighlightedNode(null);
      if (self._ws_region.update) {
        self._ws_region.update({ color: self.selectedregionbg });
      }
      self.completion.unloadRegionState(self);
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

    setNormalization(val) {
      // console.log(val)
    },

    beforeDestroy() {
      if (self._ws_region) self._ws_region.remove();
    },

    onClick(wavesurfer) {
      if (!self.completion.edittable) return;

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

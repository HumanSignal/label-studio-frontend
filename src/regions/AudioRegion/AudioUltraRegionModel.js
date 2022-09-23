import { types } from "mobx-state-tree";
import { AudioModel } from "../../tags/object/AudioNext";
import Utils from "../../utils";
import Constants from "../../core/Constants";

export const AudioUltraRegionModel = types
  .model("AudioUltraRegionModel", {
    type: "audioregion",
    object: types.late(() => types.reference(AudioModel)),

    start: types.number,
    end: types.number,

    selectedregionbg: types.optional(types.string, "rgba(0, 0, 0, 0.5)"),
  })
  .volatile(() => ({
    hideable: true,
  }))
  .views(self => ({
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
  .actions(self => {
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
    return {
      serialize() {
        const res = {
          original_length: self.object._ws?.duration,
          value: {
            start: self.start,
            end: self.end,
          },
        };

        return res;
      },

      getColor(alpha = 1) {
        return Utils.Colors.convertToRGBA(self.getOneColor(), alpha);
      },

      updateColor(alpha = 1) {
        const color = self.getColor(alpha);

        self._ws_region?.updateColor(color);
      },

      // updateAppearenceFromState() {
      //   if (self._ws_region?.update) {
      //     self._ws_region.start = self.start;
      //     self._ws_region.end = self.end;
      //     self.applyCSSClass(self._ws_region);
      //   }
      // },

      /**
       * Select audio region
       */
      selectRegion() {
        if (!self._ws_region) return;
        self._ws_region.handleSelected(true);

        // @todo: figure out a way to scroll to the region
      
        // if (el) {
        //   // scroll object tag but don't scroll the document
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
        if (!self._ws_region) return;
        self._ws_region.handleSelected(false);
      },

      setHighlight(val) {
        self._highlighted = val;

        if (!self._ws_region) return;
        self._ws_region.handleHighlighted(val);

        // if (val) {
        //   self.updateColor(0.8);
        //   self._ws_region.element.style.border = Constants.HIGHLIGHTED_CSS_BORDER;
        // } else {
        //   self.updateColor(0.3);
        //   self._ws_region.element.style.border = "none";
        // }
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

          // self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
        }

        self.onClickRegion(ev);
      },

      onMouseOver() {
        if (self.annotation.relationMode) {
          self.setHighlight(true);
          self._ws_region.swithCursor(Constants.RELATION_MODE_CURSOR);
        }
      },

      onMouseLeave() {
        if (self.annotation.relationMode) {
          self.setHighlight(false);
          self._ws_region.swithCursor(Constants.MOVE_CURSOR);
        }
      },

      onUpdateEnd() {
        self.start = self._ws_region.start;
        self.end = self._ws_region.end;
        console.log("onUpdateEnd", self.start, self.end);
        self.notifyDrawingFinished();
      },

      toggleHidden(e) {
        e?.stopPropagation();
        self.hidden = !self.hidden;

        if(!self._ws_region) return;
        self._ws_region.setVisibility(!self.hidden);
      },
    };
  });

import { types, onSnapshot, getRoot } from "mobx-state-tree";

import Hotkey from "../core/Hotkey";
import Utils from "../utils";

/**
 * Setting store of Label Studio
 */
const SettingsModel = types
  .model("SettingsModel", {
    /**
     * Hotkey
     */
    enableHotkeys: types.optional(types.boolean, true),
    /**
     * Hotkey panel
     */
    enablePanelHotkeys: types.optional(types.boolean, true),
    /**
     * Tooltips preview
     */
    enableTooltips: types.optional(types.boolean, false),

    enableLabelTooltips: types.optional(types.boolean, true),

    fullscreen: types.optional(types.boolean, false),

    bottomSidePanel: types.optional(types.boolean, false),

    imageFullSize: types.optional(types.boolean, false),

    enableAutoSave: types.optional(types.boolean, false),

    showLabels: types.optional(types.boolean, false),

    // showScore: types.optional(types.boolean, false),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }))
  .actions(self => ({
    afterCreate() {
      const { localStorage } = window;

      if (localStorage) {
        const lsKey = "labelStudio:settings";

        // load settings from the browser store
        const lss = localStorage.getItem(lsKey);
        if (lss) {
          const lsp = JSON.parse(lss);
          typeof lsp === "object" &&
            lsp !== null &&
            Object.keys(lsp).forEach(k => {
              if (k in self) self[k] = lsp[k];
            });
        }

        // capture changes and save it
        onSnapshot(self, ss => {
          localStorage.setItem(lsKey, JSON.stringify(ss));
        });
      }
    },

    //   toggleShowScore() {
    //       self.showScore = !self.showScore;
    // },

    toggleShowLabels() {
      self.showLabels = !self.showLabels;

      Utils.HTML.toggleLabelsAndScores(self.showLabels);

      // const c = getRoot(self).completionStore.selected;
      // c.regionStore.regions.forEach(r => {
      //   // TODO there is no showLables in the regions right now
      //   return typeof r.showLabels === "boolean" && r.setShowLables(self.showLabels);
      // });
    },

    toggleAutoSave() {
      self.enableAutoSave = !self.enableAutoSave;
    },

    toggleHotkeys() {
      self.enableHotkeys = !self.enableHotkeys;
      if (self.enableHotkeys) {
        Hotkey.setScope("__main__");
      } else {
        Hotkey.setScope("__none__");
      }
    },

    /**
     * Function to off/on panel of hotkeys
     */
    togglePanelHotkeys() {
      self.enablePanelHotkeys = !self.enablePanelHotkeys;
    },

    /**
     * Function to off/on tooltips
     */
    toggleTooltips() {
      self.enableTooltips = !self.enableTooltips;
    },

    toggleFullscreen() {
      self.fullscreen = !self.fullscreen;
    },

    toggleBottomSP() {
      self.bottomSidePanel = !self.bottomSidePanel;
    },

    toggleImageFS() {
      self.imageFullSize = !self.imageFullSize;
    },

    toggleLabelTooltips() {
      self.enableLabelTooltips = !self.enableLabelTooltips;
    },
  }));

export default SettingsModel;

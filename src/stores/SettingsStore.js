import { getRoot, onSnapshot, types } from "mobx-state-tree";

import { Hotkey } from "../core/Hotkey";
import Utils from "../utils";
import { isDefined } from "../utils/utilities";

const SIDEPANEL_MODE_REGIONS = "SIDEPANEL_MODE_REGIONS";
const SIDEPANEL_MODE_LABELS = "SIDEPANEL_MODE_LABELS";
const LS_SETTINGS_KEY = "labelStudio:settings";

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

    /**
     * Keep label selected after creating a region
     */
    continuousLabeling: false,

    // select regions after creating them
    selectAfterCreate: false,

    fullscreen: types.optional(types.boolean, false),

    bottomSidePanel: types.optional(types.boolean, false),

    sidePanelMode: types.optional(
      types.enumeration([SIDEPANEL_MODE_REGIONS, SIDEPANEL_MODE_LABELS]),
      SIDEPANEL_MODE_REGIONS,
    ),

    imageFullSize: types.optional(types.boolean, false),

    enableAutoSave: types.optional(types.boolean, false),

    showLabels: types.optional(types.boolean, false),

    showLineNumbers: false,

    showAnnotationsPanel: types.optional(types.boolean, true),

    showPredictionsPanel: types.optional(types.boolean, true),
    // showScore: types.optional(types.boolean, false),
  })
  .views(self => ({
    get annotation() {
      return getRoot(self).annotationStore.selected;
    },
    get displayLabelsByDefault() {
      return self.sidePanelMode === SIDEPANEL_MODE_LABELS;
    },
  }))
  .preProcessSnapshot((snapshot) => {
    console.log('BEFORE', { ...snapshot });
    // sandboxed environment may break even on check of this property
    try {
      const { localStorage } = window;

      if (!localStorage) return snapshot;
    } catch (e) {
      return snapshot;
    }

    // load settings from the browser store
    const lss = localStorage.getItem(LS_SETTINGS_KEY);

    if (lss) {
      const lsp = JSON.parse(lss);

      if (isDefined(lsp) && typeof lsp === "object") {
        Object.entries(lsp).forEach(([key, value]) => {
          console.log({ key, value });
          if (!isDefined(snapshot[key])) snapshot[key] = value;
        });
      }
    }

    console.log('AFTER', { ...snapshot });

    return snapshot;
  })
  .actions(self => ({
    afterCreate() {
      // capture changes and save it
      onSnapshot(self, ss => {
        localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(ss));
      });
    },

    //   toggleShowScore() {
    //       self.showScore = !self.showScore;
    // },

    toggleShowLabels() {
      self.showLabels = !self.showLabels;

      Utils.HTML.toggleLabelsAndScores(self.showLabels);

      // const c = getRoot(self).annotationStore.selected;
      // c.regionStore.regions.forEach(r => {
      //   // TODO there is no showLables in the regions right now
      //   return typeof r.showLabels === "boolean" && r.setShowLables(self.showLabels);
      // });
    },

    toggleShowLineNumbers() {
      self.showLineNumbers = !self.showLineNumbers;

      // hack to enable it from outside, because Text spawns spans on every rerender
      // @todo it should be enabled inside Text
      document.querySelectorAll(".htx-text").forEach(text => text.classList.toggle("htx-line-numbers"));
    },

    toggleContinuousLabeling() {
      self.continuousLabeling = !self.continuousLabeling;
    },

    toggleSelectAfterCreate() {
      self.selectAfterCreate = !self.selectAfterCreate;
    },

    toggleSidepanelModel() {
      self.sidePanelMode =
        self.sidePanelMode === SIDEPANEL_MODE_LABELS ? SIDEPANEL_MODE_REGIONS : SIDEPANEL_MODE_LABELS;
      // apply immediately
      self.annotation.regionStore.setView(self.displayLabelsByDefault ? "labels" : "regions");
    },

    toggleAutoSave() {
      self.enableAutoSave = !self.enableAutoSave;
    },

    toggleHotkeys() {
      self.enableHotkeys = !self.enableHotkeys;
      if (self.enableHotkeys) {
        Hotkey.setScope(Hotkey.DEFAULT_SCOPE);
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

    toggleAnnotationsPanel() {
      self.showAnnotationsPanel = !self.showAnnotationsPanel;
    },

    togglePredictionsPanel() {
      self.showPredictionsPanel = !self.showPredictionsPanel;
    },
  }));

export default SettingsModel;

import { getEnv, getRoot, onSnapshot, types } from "mobx-state-tree";

import { Hotkey } from "../core/Hotkey";
import EditorSettings from "../core/settings/editorsettings.json";
import Utils from "../utils";

const SIDEPANEL_MODE_REGIONS = "SIDEPANEL_MODE_REGIONS";
const SIDEPANEL_MODE_LABELS = "SIDEPANEL_MODE_LABELS";

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

    preserveSelectedTool: types.optional(types.boolean, true),
  })
  .views(self => ({
    get annotation() {
      return getRoot(self).annotationStore.selected;
    },
    get displayLabelsByDefault() {
      return self.sidePanelMode === SIDEPANEL_MODE_LABELS;
    },
  }))
  .actions(self => ({
    afterCreate() {
      // sandboxed environment may break even on check of this property
      try {
        const { localStorage } = window;

        if (!localStorage) return;
      } catch (e) {
        return;
      }

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
      } else {
        const env = getEnv(self);

        Object.keys(EditorSettings).map((obj, index) => {
          if( typeof env.settings[obj] === 'boolean'){
            self[obj] = env.settings[obj];
          }else{
            self[obj] = EditorSettings[obj].defaultValue;
          }
        });
      }

      // capture changes and save it
      onSnapshot(self, ss => {
        localStorage.setItem(lsKey, JSON.stringify(ss));
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

    togglepreserveSelectedTool() {
      self.preserveSelectedTool = !self.preserveSelectedTool;
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

import { SettingsStore } from './Types';

export const InitialState: SettingsStore = {
  visible: false,
  settings: {
    enableHotkeys: true,
    enablePanelHotkeys: true,
    enableTooltips: false,
    enableLabelTooltips: true,
    continuousLabeling: false,
    selectAfterCreate: false,
    fullscreen: false,
    bottomSidePanel: false,
    imageFullSize: false,
    enableAutoSave: false,
    showLabels: false,
    showLineNumbers: false,
    showAnnotationsPanel: true,
    showPredictionsPanel: true,
    preserveSelectedTool: true,
    enableSmoothing: true,
    videoHopSize: 10,
  },
};

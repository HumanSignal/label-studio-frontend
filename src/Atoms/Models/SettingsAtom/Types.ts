export type Settings = {
  /**
   *  Hotkey
   */
  enableHotkeys: boolean,
  /**
     * Hotkey panel
     */
  enablePanelHotkeys: boolean,
  /**
     * Tooltips preview
     */
  enableTooltips: boolean,

  enableLabelTooltips: boolean,

  /**
     * Keep label selected after creating a region
     */
  continuousLabeling: boolean,

  // select regions after creating them
  selectAfterCreate: boolean,

  fullscreen: boolean,

  bottomSidePanel: boolean,

  // sidePanelMode: types.optional(
  //   types.enumeration([SIDEPANEL_MODE_REGIONS, SIDEPANEL_MODE_LABELS]),
  //   SIDEPANEL_MODE_REGIONS,
  // ),

  imageFullSize: boolean,

  enableAutoSave: boolean,

  showLabels: boolean,

  showLineNumbers: boolean,

  showAnnotationsPanel: boolean,

  showPredictionsPanel: boolean,
  // showScore?: boolean,

  preserveSelectedTool: boolean,

  enableSmoothing: boolean,

  videoHopSize: number,
}

export type SettingsStore = {
  /**
   * Settings of Label Studio
   */
  settings: Settings,

  /**
   * Is the settings modal visible
   */
  visible: boolean,
}

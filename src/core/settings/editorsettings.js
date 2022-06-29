import { FF_DEV_1442, isFF } from "../../utils/feature-flags";

export default {
  "enableHotkeys": {
    "description": "Enable labeling hotkeys",
    "onChangeEvent": "toggleHotkeys",
    "defaultValue": true,
  },
  "enableTooltips": {
    "description": "Show hotkey tooltips",
    "onChangeEvent": "toggleTooltips",
    "checked": "",
    "defaultValue": false,
  },
  "enableLabelTooltips":{
    "description": "Show labels hotkey tooltips",
    "onChangeEvent": "toggleLabelTooltips",
    "defaultValue": true,
  },
  "showLabels": {
    "description": "Show labels inside the regions",
    "onChangeEvent": "toggleShowLabels",
    "defaultValue": false,
  },
  "continuousLabeling": {
    "description": "Keep label selected after creating a region",
    "onChangeEvent": "toggleContinuousLabeling",
    "defaultValue": false,
  },
  "selectAfterCreate": {
    "description": "Select regions after creating",
    "onChangeEvent": "toggleSelectAfterCreate",
    "defaultValue": false,
  },
  "showLineNumbers": {
    "description": "Show line numbers for Text",
    "onChangeEvent": "toggleShowLineNumbers",
    "defaultValue": false,
  },
  "preserveSelectedTool": {
    "description": "Remember Selected Tool",
    "onChangeEvent": "togglepreserveSelectedTool",
    "defaultValue": true,
  },
  "enableSmoothing": {
    "description": "Enable image smoothing when zoom",
    "onChangeEvent": "toggleSmoothing",
    "defaultValue": true,
  },
  ...(isFF(FF_DEV_1442) ? ({ "deselectRegionOnOutsideClick": {
    "description": "Deselect region when clicking outside of it",
    "onChangeEvent": "toggleRegionDeselect",
    "defaultValue": false, 
  } }) : null),
};


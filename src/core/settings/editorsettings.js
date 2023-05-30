export default {
  'enableHotkeys': {
    'newUI': {
      'order': 0,
      'title': 'Labeling hotkeys',
      'description': 'Enables quick selection of labels using hotkeys',
    },
    'description': 'Enable labeling hotkeys',
    'onChangeEvent': 'toggleHotkeys',
    'defaultValue': true,
  },
  'enableTooltips': {
    'newUI': {
      'order': 1,
      'title': 'Show hotkeys on tooltips',
      'description': 'Displays keybindings on tools and actions tooltips',
    },
    'description': 'Show hotkey tooltips',
    'onChangeEvent': 'toggleTooltips',
    'checked': '',
    'defaultValue': false,
  },
  'enableLabelTooltips': {
    'newUI': {
      'order': 2,
      'title': 'Show hotkeys on labels',
      'description': 'Displays keybindings on labels',
    },
    'description': 'Show labels hotkey tooltips',
    'onChangeEvent': 'toggleLabelTooltips',
    'defaultValue': true,
  },
  'showLabels': {
    'newUI': {
      'order': 3,
      'title': 'Show region labels',
      'description': 'Display region label names',
    },
    'description': 'Show labels inside the regions',
    'onChangeEvent': 'toggleShowLabels',
    'defaultValue': false,
  },
  'continuousLabeling': {
    'newUI': {
      'order': 4,
      'title': 'Keep label selected after creating a region',
      'description': 'Allows continuous region creation using the selected label',
    },
    'description': 'Keep label selected after creating a region',
    'onChangeEvent': 'toggleContinuousLabeling',
    'defaultValue': false,
  },
  'selectAfterCreate': {
    'newUI': {
      'order': 5,
      'title': 'Select region after creating it',
      'description': 'Automatically selects newly created regions',
    },
    'description': 'Select regions after creating',
    'onChangeEvent': 'toggleSelectAfterCreate',
    'defaultValue': false,
  },
  'showLineNumbers': {
    'newUI': {
      'order': 7,
      'title': 'Show line numbers for text',
      'description': 'Identify and reference specific lines of text in your document',
    },
    'description': 'Show line numbers for Text',
    'onChangeEvent': 'toggleShowLineNumbers',
    'defaultValue': false,
  },
  'preserveSelectedTool': {
    'newUI': {
      'order': 6,
      'title': 'Keep selected tool',
      'description': 'Persists the selected tool across tasks',
    },
    'description': 'Remember Selected Tool',
    'onChangeEvent': 'togglepreserveSelectedTool',
    'defaultValue': true,
  },
  'enableSmoothing': {
    'newUI': {
      'order': 8,
      'title': 'Image smoothing when zooming in',
      'description': 'Smooth pixels when zooming in',
    },
    'description': 'Enable image smoothing when zoom',
    'onChangeEvent': 'toggleSmoothing',
    'defaultValue': true,
  },
};


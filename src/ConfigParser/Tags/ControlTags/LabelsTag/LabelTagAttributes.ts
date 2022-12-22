// toname: types.maybeNull(types.string),

import { BaseControlTagAttributes } from '@tags/Base/BaseControlTag/BaseControlTagAttributes';

// choice: types.optional(types.enumeration(['single', 'multiple']), 'single'),
// maxusages: types.maybeNull(types.string),
// showinline: types.optional(types.boolean, true),

// // TODO this will move away from here
// groupdepth: types.maybeNull(types.string),

// opacity: types.optional(customTypes.range(), '0.2'),
// fillcolor: types.optional(customTypes.color, '#f48a42'),

// strokewidth: types.optional(types.string, '1'),
// strokecolor: types.optional(customTypes.color, '#f48a42'),
// fillopacity: types.maybeNull(customTypes.range()),
// allowempty: types.optional(types.boolean, false),

export class LabelsTagAttributes extends BaseControlTagAttributes {
  attributes = {
    'choice': {
      type: ['single', 'multiple'],
      defaultValue: 'single',
    },
  };
}

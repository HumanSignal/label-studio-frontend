import { ControlController } from '@tags/Base/Control/ControlController';
import { TagType } from '@tags/Base/TagController';
import { atom } from 'jotai';
import { attr } from 'src/Engine/ConfigTree/Attributes/AttributeCreators';
import { LabelController } from '../Label/LabelController';

class LabelsTagAttributes extends ControlController {
  static type = TagType.labels;

  static allowedChildrenTypes = [TagType.label];

  /**
   * Defines if multiple labels per one region can be selected
   * @default {string} 'single'
   */
  choice = attr.oneOf(['single', 'multiple'], 'single');

  /**
   * How many times the label can be applied in a scope of single annotation
   * @default {number} Infinity
   */
  maxusages = attr.number();

  /**
   * Show labels in a single line
   * @default {boolean} true
   */
  showinline = attr.boolean(true);

  /**
   * How deeply labels can be nested
   * @default {number} Infinity
   */
  groupdepth = attr.number();

  /**
   * Visual opacity of the label
   * @default {string} '0.2'
   */
  opacity = attr.string('0.2');

  /**
   * Background color of a label
   * @default {string} '#f48a42'
   */
  fillcolor = attr.string('#f48a42');

  /**
   * Opacity of the label's background
   * @default {number} 1
   */
  fillopacity = attr.number(1, 0, 1);

  /**
   * Border thickness of a label
   * @default {number} 1
   */
  strokewidth = attr.number(1);

  /**
   * Border color of a label
   * @default {string} '#f48a42'
   */
  strokecolor = attr.string('#f48a42');

  /**
   * Allow label to be empty
   * @default {boolean} false
   */
  allowempty = attr.boolean(false);

  /**
   * Visibility of the label
   * @default {boolean} true
   */
  visible = attr.boolean(true);
}

export class LabelsController extends LabelsTagAttributes {
  selectedLabelsAtom = atom<LabelController[]>([]);
}

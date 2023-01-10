import { TagType } from '@tags/Base/Base/BaseTagController';
import { BaseControlTagController } from '@tags/Base/BaseControl/BaseControlTagController';
import { attr } from 'src/ConfigParser/ConfigTree/Attributes/AttributeCreators';

class LabelsTagController extends BaseControlTagController {
  static type = TagType.labels;

  static allowedChildrenTypes = [TagType.label];

  /**
   * Defines if multiple labels per one region can be selected
   * @default {string} 'single'
   */
  choice = attr.oneOf(['single', 'multiple'], 'single');
  maxusages = attr.number();
  showinline = attr.boolean(true);
  groupdepth = attr.number();
  opacity = attr.string('0.2');
  fillcolor = attr.string('#f48a42');
  strokewidth = attr.number(1);
  strokecolor = attr.string('#f48a42');
  fillopacity = attr.number(1,  0, 1);
  allowempty = attr.boolean();
  visible = attr.boolean(true);
}

export { LabelsTagController };

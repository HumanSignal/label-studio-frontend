import { attr } from 'src/ConfigParser/ConfigTree/Attributes/AttributeCreators';
import { BaseTagController, TagType } from '../Base/BaseTagController';

class BaseControlTagController extends BaseTagController {
  static type: TagType = TagType.base;

  static allowedChildrenTypes: TagType[] = [];

  static allowChildren = true;

  /**
   * Name of the element
   */
  name = attr.string().required();

  /**
   * Name of the controller element
   */
  toname = attr.string().required();
}

export { BaseControlTagController };

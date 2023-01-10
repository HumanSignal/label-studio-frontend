import { attr } from 'src/ConfigParser/ConfigTree/Attributes/AttributeCreators';
import { BaseTagController, TagType } from '../Base/BaseTagController';

class BaseObjectTagController extends BaseTagController {
  static type: TagType = TagType.base;

  static allowedChildrenTypes: TagType[] = [];

  static allowChildren = true;

  /**
   * Name of the element
   */
  name = attr.string().required();
}

export { BaseObjectTagController };

import { attr } from 'src/Engine/ConfigTree/Attributes/AttributeCreators';
import { TagController, TagType } from '../TagController';

class ControlAttributes extends TagController {
  /**
   * Name of the element
   */
  name = attr.string().required();

  /**
   * Name of the controller element
   */
  toname = attr.string().required();
}

class ControlController extends ControlAttributes {
  static type: TagType = TagType.base;

  static allowedChildrenTypes: TagType[] = [];

  static allowChildren = true;
}

export { ControlController };

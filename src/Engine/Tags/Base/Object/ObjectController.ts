import { attr } from 'src/Engine/ConfigTree/Attributes/AttributeCreators';
import { Awaiter } from 'src/utils/Awaiter';
import { TagController, TagType } from '../TagController';

class ObjectAttributes extends TagController {
  /**
   * Name of the element
   */
  name = attr.string().required();
}

class ObjectController extends ObjectAttributes {
  static type: TagType = TagType.base;

  static allowedChildrenTypes: TagType[] = [];

  static allowChildren = true;

  isReady = Awaiter<boolean>();

  markAsReady() {
    this.isReady.resolve(true);

    console.log(this.isReady);
  }
}

export { ObjectController };

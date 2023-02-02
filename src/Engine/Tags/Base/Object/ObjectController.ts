import { attr } from 'src/Engine/ConfigTree/Attributes/AttributeCreators';
import { Awaiter } from 'src/utils/Awaiter';
import { isDefined } from 'src/utils/utilities';
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

  get controls() {
    const name = this.name.value;
    const configNodes = this.sdk.tree.findNodes(`[toname="${name}"]`);

    return configNodes
      .map(configNode => this.sdk.tree.findActiveController(configNode))
      .filter(isDefined);
  }

  markAsReady() {
    this.isReady.resolve(true);
  }
}

export { ObjectController };

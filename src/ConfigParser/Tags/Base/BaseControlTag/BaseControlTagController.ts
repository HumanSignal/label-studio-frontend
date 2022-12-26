import { ConfigAttributes } from 'src/ConfigParser/ConfigTree/ConfigAttributes';
import { withAttributes } from '../BaseTag/BaseTagAttributes';
import { BaseTagController, TagType } from '../BaseTag/BaseTagController';

@withAttributes([
  { name: 'name', required: false },
])
class BaseControlTagController extends BaseTagController {
  static type: TagType = TagType.base;

  static allowedChildrenTypes: TagType[] = [];

  static allowChildren = true;

  static attributeParser = ConfigAttributes;
}

export { BaseControlTagController };

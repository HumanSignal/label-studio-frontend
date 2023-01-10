import { TagType } from '@tags/Base/Base/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisual/BaseVisualTagController';

class ViewTagController extends BaseVisualTagController {
  static type = TagType.view;

  static allowedChildrenTypes: TagType[] = [];
}

export { ViewTagController };

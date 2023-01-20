import { TagType } from '@tags/Base/TagController';
import { VisualController } from '@tags/Base/Visual/VisualController';

class ViewController extends VisualController {
  static type = TagType.view;

  static allowedChildrenTypes: TagType[] = [];
}

export { ViewController };

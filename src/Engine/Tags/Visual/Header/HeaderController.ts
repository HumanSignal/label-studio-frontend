import { TagType } from '@tags/Base/TagController';
import { VisualController } from '@tags/Base/Visual/VisualController';

class HeaderController extends VisualController {
  static type = TagType.header;
}

export { HeaderController };

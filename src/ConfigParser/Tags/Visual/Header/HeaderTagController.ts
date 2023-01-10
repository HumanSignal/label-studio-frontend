import { TagType } from '@tags/Base/Base/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisual/BaseVisualTagController';

class HeaderTagController extends BaseVisualTagController {
  static type = TagType.header;
}

export { HeaderTagController };

import { TagType } from '@tags/Base/BaseTag/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisualTag/BaseVisualTagController';
import { HeaderTagView } from './HeaderTagView';

export class HeaderTagController extends BaseVisualTagController {
  static type = TagType.header;
}

HeaderTagController.setView(HeaderTagView);

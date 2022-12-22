import { InternalTagType } from '@tags/Base/BaseTag/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisualTag/BaseVisualTagController';
import { ViewTagView } from './ViewTagView';

export class ViewTagController extends BaseVisualTagController {
  static type: InternalTagType = 'view';

  static allowedChildrenTypes: InternalTagType[] = [];
}

ViewTagController.setView(ViewTagView);

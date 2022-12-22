import { InternalTagType } from '@tags/Base/BaseTag/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisualTag/BaseVisualTagController';
import { LabelTagView } from './LabelTagView';

export class LabelTagController extends BaseVisualTagController {
  static type: InternalTagType = 'label';

  static allowedChildrenTypes: InternalTagType[] = [];
}

LabelTagController.setView(LabelTagView);

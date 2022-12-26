import { TagType } from '@tags/Base/BaseTag/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisualTag/BaseVisualTagController';
import { LabelTagView } from './LabelTagView';

export class LabelTagController extends BaseVisualTagController {
  static type = TagType.label;
}

LabelTagController.setView(LabelTagView);

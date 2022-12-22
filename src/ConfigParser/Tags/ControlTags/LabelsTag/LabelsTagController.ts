import { InternalTagType } from '@tags/Base/BaseTag/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisualTag/BaseVisualTagController';
import { LabelsTagView } from './LabelsTagView';

export class LabelsTagController extends BaseVisualTagController {
  static type: InternalTagType = 'labels';

  static allowedChildrenTypes: InternalTagType[] = [
    'label',
  ];
}

LabelsTagController.setView(LabelsTagView);

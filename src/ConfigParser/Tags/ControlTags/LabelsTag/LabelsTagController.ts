import { BaseControlTagController } from '@tags/Base/BaseControlTag/BaseControlTagController';
import { TagType } from '@tags/Base/BaseTag/BaseTagController';
import { LabelsTagView } from './LabelsTagView';

export class LabelsTagController extends BaseControlTagController {
  static type = TagType.labels;

  static allowedChildrenTypes = [TagType.label];
}

LabelsTagController.setView(LabelsTagView);

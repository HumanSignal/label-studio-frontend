import { InternalTagType } from '@tags/Base/BaseTag/BaseTagController';
import { LabelsTagController } from '../LabelsTag/LabelsTagController';
import { LabelsTagView } from '../LabelsTag/LabelsTagView';

export class HypertextLabelsTagController extends LabelsTagController {
  static type: InternalTagType = 'hypertextlabels';

  static allowedChildrenTypes: InternalTagType[] = [
    'label',
  ];
}

HypertextLabelsTagController.setView(LabelsTagView);

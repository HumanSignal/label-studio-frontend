import { TagType } from '@tags/Base/BaseTag/BaseTagController';
import { LabelsTagController } from '../LabelsTag/LabelsTagController';
import { LabelsTagView } from '../LabelsTag/LabelsTagView';

export class HypertextLabelsTagController extends LabelsTagController {
  static type = TagType.hypertextlabels;
}

HypertextLabelsTagController.setView(LabelsTagView);

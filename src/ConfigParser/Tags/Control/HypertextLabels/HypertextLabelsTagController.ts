import { TagType } from '@tags/Base/Base/BaseTagController';
import { LabelsTagController } from '../Labels/LabelsTagController';

class HypertextLabelsTagController extends LabelsTagController {
  static type = TagType.hypertextlabels;
}

export { HypertextLabelsTagController };

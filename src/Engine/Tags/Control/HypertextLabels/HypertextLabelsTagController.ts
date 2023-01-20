import { TagType } from '@tags/Base/TagController';
import { LabelsController } from '../Labels/LabelsController';

class HypertextLabelsController extends LabelsController {
  static type = TagType.hypertextlabels;

  afterRender(): void {
    this.subscribe('label-selected', (tag, data) => {
      console.log(tag, data);
    });
  }
}

export { HypertextLabelsController };

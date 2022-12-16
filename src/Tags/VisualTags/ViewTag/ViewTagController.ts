import { InternalTagType } from '@tags/Base/BaseTag/BaseTagController';
import { BaseVisualTagController } from 'src/Tags/Base/BaseVisualTag/BaseVisualTagController';
import { ViewTagView } from './ViewTagView';

export class ViewTagController extends BaseVisualTagController {
  static type: InternalTagType = 'view';

  static allowedChildrenTypes: InternalTagType[] = [];

  private view = ViewTagView;

  render() {
    return this.view;
  }
}

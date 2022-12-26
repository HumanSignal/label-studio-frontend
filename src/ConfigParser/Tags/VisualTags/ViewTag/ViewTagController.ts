import { TagType } from '@tags/Base/BaseTag/BaseTagController';
import { BaseVisualTagController } from '@tags/Base/BaseVisualTag/BaseVisualTagController';
import { ViewTagView } from './ViewTagView';

export class ViewTagController extends BaseVisualTagController {
  static type = TagType.view;

  static allowedChildrenTypes: TagType[] = [];
}

ViewTagController.setView(ViewTagView);

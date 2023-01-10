import { BaseTagController, TagType } from '../Base/BaseTagController';

export class BaseVisualTagController extends BaseTagController {
  static type = TagType.baseVisual;

  static allowChildren = true;
}

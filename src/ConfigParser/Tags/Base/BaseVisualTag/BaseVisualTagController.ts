import { BaseTagController, BaseTagControllerAbstract, TagType } from '../BaseTag/BaseTagController';

export class BaseVisualTagController extends BaseTagController implements BaseTagControllerAbstract {
  static type = TagType.baseVisual;

  static allowChildren = true;
}

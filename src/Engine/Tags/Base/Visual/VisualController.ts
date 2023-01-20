import { TagController, TagType } from '../TagController';

export class VisualController extends TagController {
  static type = TagType.baseVisual;

  static allowChildren = true;
}

import { TagType } from '@tags/Base/Base/BaseTagController';
import { TextTagController } from '../Text/TextTagController';
import './HypertextTagView';

class HypertextTagController extends TextTagController {
  static type = TagType.hypertext;
  static allowChildren = false;
}

export { HypertextTagController };

import { TagType } from '@tags/Base/TagController';
import { TextController } from '../Text/TextController';
import './HypertextView';

class HypertextController extends TextController {
  static type = TagType.hypertext;
  static allowChildren = false;
}

export { HypertextController };

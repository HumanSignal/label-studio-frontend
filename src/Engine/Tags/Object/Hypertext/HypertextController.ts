import { TagType } from '@tags/Base/TagController';
import { HypertextValue } from 'src/Engine/Regions/Hypertext/HypertextValue';
import { TextController } from '../Text/TextController';
import './HypertextView';

class HypertextController extends TextController {
  static type = TagType.hypertext;
  static allowChildren = false;

  get ResultCreator() {
    return HypertextValue;
  }
}

export { HypertextController };

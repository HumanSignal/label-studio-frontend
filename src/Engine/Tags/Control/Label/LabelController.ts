import { ControlController } from '@tags/Base/Control/ControlController';
import { TagType } from '@tags/Base/TagController';
import ColorScheme from 'pleasejs';
import Constants from 'src/core/Constants';
import { attr } from 'src/Engine/ConfigTree/Attributes/AttributeCreators';
import './LabelView';

class LabelAttributes extends ControlController {
  value = attr.string().required();
  selected = attr.boolean(false);
  maxusages = attr.number();
  alias = attr.string();
  hint = attr.string();
  hotkey = attr.string();
  showalias = attr.boolean(false);
  aliasstyle = attr.string('opacity: 0.6');
  size = attr.oneOf(['small', 'medium', 'large'], 'medium');
  background = attr.string(Constants.LABEL_BACKGROUND);
  selectedcolor = attr.string('#ffffff');
  granularity = attr.oneOf(['symbol', 'word', 'sentence', 'paragraph'], 'symbol');
  groupcancontain = attr.string();
}

class LabelController extends LabelAttributes {
  static type = TagType.label;

  get backgroundColor() {
    if (this.background.value !== Constants.LABEL_BACKGROUND) {
      return this.background.value;
    }

    return ColorScheme.make_color({
      format: 'rgb-string',
      colors_returned: 1,
      seed: this.value.value,
    })[0] as string;
  }
}

export { LabelController };

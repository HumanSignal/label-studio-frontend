import { TagType } from '@tags/Base/Base/BaseTagController';
import { BaseControlTagController } from '@tags/Base/BaseControl/BaseControlTagController';
import ColorScheme from 'pleasejs';
import { attr } from 'src/ConfigParser/ConfigTree/Attributes/AttributeCreators';
import Constants from 'src/core/Constants';
import './LabelTagView';

class LabelTagController extends BaseControlTagController {
  static type = TagType.label;

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

export { LabelTagController };

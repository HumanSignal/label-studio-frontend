import { ControlController } from '@tags/Base/Control/ControlController';
import { TagType } from '@tags/Base/TagController';
import ColorScheme from 'pleasejs';
import { attr } from 'src/Engine/ConfigTree/Attributes/AttributeCreators';
import { LabelsController } from '../Labels/LabelsController';
import './LabelView';

class LabelAttributes extends ControlController {
  /**
   * The value of the label.
   */
  value = attr.string().required();
  selected = attr.boolean(false);
  maxUsages = attr.number();
  alias = attr.string();
  hint = attr.string();
  hotkey = attr.string();
  showAlias = attr.boolean(false);
  aliasStyle = attr.string('opacity: 0.6');
  size = attr.oneOf(['small', 'medium', 'large'], 'medium');
  background = attr.parser((attr) => {
    const color = attr.value;

    return (color ?? ColorScheme.make_color({
      format: 'rgb-string',
      colors_returned: 1,
      seed: this.value.value,
    })[0]) as string;
  });
  selectedColor = attr.string('#ffffff');
  granularity = attr.oneOf(['symbol', 'word', 'sentence', 'paragraph'], 'symbol');
  groupCanContain = attr.string();
}

class LabelController extends LabelAttributes {
  static type = TagType.label;

  get selectedLabelsAtom() {
    return (this.parent as LabelsController).selectedLabelsAtom;
  }

  toggleSelected() {
    (this.parent as LabelsController).toggleSelection(this);
  }
}

export { LabelController };

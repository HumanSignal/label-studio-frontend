import { useSettings } from '@atoms/Models/SettingsAtom/Hooks';
import { Label } from '@components/Label/Label';
import { defineTagView } from '@tags/Base/Base/BaseTagController';
import { Tooltip } from 'antd';
import * as StyleUtils from 'src/utils/styles';
import { LabelTagController } from './LabelTagController';

const LabelTagView = defineTagView(LabelTagController, ({
  node,
  controller,
}) => {
  const [settings] = useSettings();
  const item: any = {
    visible: true,
  };
  const hotkey = (settings.enableTooltips || settings.enableLabelTooltips) && settings.enableHotkeys && item.hotkey;

  const content = node.element.innerHTML;

  const label = (
    <Label
      color={controller.backgroundColor}
      margins
      empty={item.isEmpty}
      hotkey={hotkey}
      hidden={!item.visible}
      selected={item.selected}
      onClick={() => {
        return item.onClick();
      }}
    >
      {content ? (
        <div title={item._value} dangerouslySetInnerHTML={{ __html: content }}/>
      ) :  controller.value.value }

      {controller.showalias.value === true && controller.alias.value && (
        <span style={StyleUtils.styleToProp(controller.aliasstyle.value ?? '')}>
          &nbsp;{controller.alias.value}
        </span>
      )}
    </Label>
  );

  return controller.hint.value
    ? <Tooltip title={controller.hint.value}>{label}</Tooltip>
    : label;
});

export { LabelTagView, LabelTagController };

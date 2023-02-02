import { Label } from '@components/Label/Label';
import { defineTagView } from '@tags/Base/TagController';
import { Tooltip } from '@UI/Tooltip/Tooltip';
import { useAtomValue } from 'jotai';
import { useSettings } from 'src/Engine/Atoms/Models/SettingsAtom/Hooks';
import * as StyleUtils from 'src/utils/styles';
import { LabelController } from './LabelController';

export const LabelView = defineTagView(LabelController, ({
  node,
  controller,
}) => {
  const [settings] = useSettings();
  const item: any = {
    visible: true,
  };
  const hotkey = (settings.enableTooltips || settings.enableLabelTooltips) && settings.enableHotkeys && controller.hotkey.value;

  const content = node.element.innerHTML;
  const selection = useAtomValue(controller.selectedLabelsAtom);
  const selected = selection.includes(controller);

  const label = (
    <Label
      color={controller.background.value}
      margins
      empty={item.isEmpty}
      hotkey={hotkey}
      hidden={!item.visible}
      selected={selected}
      onClick={() => controller.toggleSelected()}
    >
      {content ? (
        <div title={item._value} dangerouslySetInnerHTML={{ __html: content }}/>
      ) : controller.value.value }

      {controller.showAlias.value === true && controller.alias.value && (
        <span style={StyleUtils.styleToProp(controller.aliasStyle.value ?? '')}>
          &nbsp;{controller.alias.value}
        </span>
      )}
    </Label>
  );

  return controller.hint.value
    ? <Tooltip title={controller.hint.value}>{label}</Tooltip>
    : label;
});

export { LabelController };

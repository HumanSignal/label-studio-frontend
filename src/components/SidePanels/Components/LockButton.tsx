import { observer } from 'mobx-react';
import { FC } from 'react';
import { IconLockLocked, IconLockUnlocked } from '../../../assets/icons';
import { ButtonProps } from '../../../common/Button/Button';
import { RegionControlButton } from './RegionControlButton';

export const LockButton: FC<{
  item: any,
  annotation: any,
  hovered: boolean,
  locked: boolean,
  hotkey?: string,
  look?: ButtonProps['look'],
  style?: ButtonProps['style'],
  onClick: () => void,
}> = observer(({ item, annotation, hovered, locked, hotkey, look, style, onClick }) => {
  if (!item) return null;
  const isLocked = locked || item.isReadOnly() || annotation.isReadOnly();
  const isRegionReadonly = item.isReadOnly() && !locked;

  return item && (hovered || item.isReadOnly() || locked) && (
    <RegionControlButton disabled={isRegionReadonly} onClick={onClick} hotkey={hotkey} look={look} style={style}>
      {isLocked ? <IconLockLocked/> : <IconLockUnlocked/>}
    </RegionControlButton>
  );
});

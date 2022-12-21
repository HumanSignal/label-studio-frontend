import { FC } from 'react';
import { IconInfo } from 'src/assets/icons';
import { Button } from 'src/common/Button/Button';

export type InstructionsButtonProps = {
  enabled: boolean,
  instructionsVisible: boolean,
  toggleInstructionsVisibility: () => void,
}

export const InstructionsButton: FC<InstructionsButtonProps> = ({
  enabled,
  instructionsVisible,
  toggleInstructionsVisibility,
}) => {
  return enabled ? (
    <Button
      icon={<IconInfo style={{ width: 16, height: 16 }}/>}
      primary={instructionsVisible}
      type="text"
      aria-label="Instructions"
      onClick={() => toggleInstructionsVisibility()}
      style={{
        height: 36,
        width: 36,
        padding: 0,
      }}
    />
  ) : null;
};

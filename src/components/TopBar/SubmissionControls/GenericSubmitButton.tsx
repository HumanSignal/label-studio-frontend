import { useSettings } from '@atoms/Models/SettingsAtom/Hooks';
import { FC, MouseEvent } from 'react';
import { Button, ButtonProps } from 'src/common/Button/Button';
import { Tooltip } from 'src/common/Tooltip/Tooltip';

const TOOLTIP_DELAY = 0.8;

type ButtonTooltipProps = {
  title: string,
  children: JSX.Element,
}

const ButtonTooltip: FC<ButtonTooltipProps> = ({ title, children }) => {
  const [settings] = useSettings();

  return (
    <Tooltip
      title={title}
      enabled={settings.enableTooltips}
      mouseEnterDelay={TOOLTIP_DELAY}
    >
      {children}
    </Tooltip>
  );
};

type SubmitButtonProps = {
  title: string,
  disabled: boolean,
  tooltip: string,
  look: ButtonProps['look'],
  ariaLabel: string,
  onClick: (event: MouseEvent) => void,
}

export const SubmitButton: FC<SubmitButtonProps> = ({
  disabled,
  title,
  look,
  tooltip,
  onClick,
  ...props
}) => {
  return (
    <ButtonTooltip key="update" title={tooltip}>
      <Button
        aria-label={props.ariaLabel}
        disabled={disabled}
        look={look}
        onClick={onClick}
      >
        {title}
      </Button>
    </ButtonTooltip>
  );
};

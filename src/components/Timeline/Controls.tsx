import React, { FC, MouseEvent, MutableRefObject, useContext, useEffect, useMemo, useRef, useState } from "react";
import { IconBackward, IconChevronLeft, IconChevronRight, IconCollapse, IconExpand, IconFastForward, IconForward, IconFullscreen, IconFullscreenExit, IconNext, IconPause, IconPlay, IconPrev, IconRewind } from "../../assets/icons/timeline";
import { Button, ButtonProps } from "../../common/Button/Button";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import { clamp, isMacOS } from "../../utils/utilities";
import { TimelineContext } from "./Context";
import "./Controls.styl";
import { TimelineStepFunction } from "./Types";

const relativePosition = (pos: number, fps: number) => {
  const roundedFps = Math.floor(fps);
  const value = Math.floor(pos % roundedFps);
  const result = Math.floor(value > 0 ? value : roundedFps);

  return result.toString().padStart(roundedFps.toString().length, '0');
};

export type ControlsStepHandler = (
  e?: MouseEvent<HTMLButtonElement>,
  stepSize?: TimelineStepFunction
) => void;

export interface ControlsProps {
  length: number;
  position: number;
  frameRate: number;
  playing: boolean;
  collapsed: boolean;
  fullscreen: boolean;
  disableFrames?: boolean;
  extraControls?: JSX.Element | null;
  onRewind: (steps?: number) => void;
  onForward: (steps?: number) => void;
  onPlayToggle: (playing: boolean) => void;
  onFullScreenToggle: (fullscreen: boolean) => void;
  onStepBackward: ControlsStepHandler;
  onStepForward: ControlsStepHandler;
  onPositionChange: (position: number) => void;
  onToggleCollapsed: (collapsed: boolean) => void;
}

export const Controls: FC<ControlsProps> = ({
  length,
  position,
  frameRate,
  playing,
  collapsed,
  extraControls,
  fullscreen,
  disableFrames,
  onRewind,
  onForward,
  onPlayToggle,
  onFullScreenToggle,
  onStepBackward,
  onPositionChange,
  onStepForward,
  onToggleCollapsed,
}) => {
  const { settings } = useContext(TimelineContext);
  const [altControlsMode, setAltControlsMode] = useState(false);
  const [inputMode, setInputMode] = useState(false);
  const [startReached, endReached] = [position === 1, position === length];

  const time = useMemo(() => {
    return length / frameRate;
  }, [length, frameRate]);

  const currentTime = useMemo(() => {
    return position / frameRate;
  }, [position, frameRate]);

  const stepHandlerWrapper = (handler: ControlsStepHandler, stepSize?: TimelineStepFunction) => (e: MouseEvent<HTMLButtonElement>) => {
    handler(e, stepSize ?? undefined);
  };

  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      if (!settings?.stepSize) return;
      const altMode = e.key === "Shift";

      if (e.type === 'keydown' && altMode) {
        setAltControlsMode(true);
      } else if (e.type === 'keyup' && altMode && altControlsMode) {
        setAltControlsMode(false);
      }
    };

    document.addEventListener('keydown', keyboardHandler);
    document.addEventListener('keyup', keyboardHandler);

    return () => {
      document.removeEventListener('keydown', keyboardHandler);
      document.removeEventListener('keyup', keyboardHandler);
    };
  }, [altControlsMode]);

  return (
    <Block name="timeline-controls" tag={Space} spread>
      <Elem name="group" tag={Space} size="small">
        <Elem name="counter" onClick={() => setInputMode(true)}>
          {inputMode ? (
            <FrameInput
              length={length}
              position={position}
              onChange={(value) => {
                onPositionChange?.(value);
              }}
              onFinishEditing={() => {
                setInputMode(false);
              }}
            />
          ) : (
            <>{position} <span>of {length}</span></>
          )}
        </Elem>
      </Elem>

      <Elem name="main-controls">
        <Elem name="group" tag={Space} collapsed>
          {extraControls}
        </Elem>
        <Elem name="group" tag={Space} collapsed>
          <AltControls
            showAlterantive={altControlsMode && !disableFrames}
            main={(
              <>
                {settings?.stepSize && !disableFrames && (
                  <ControlButton
                    onClick={stepHandlerWrapper(onStepBackward, settings.stepSize)}
                    hotkey={settings?.stepAltBack}
                    disabled={startReached}
                  >
                    {<IconPrev/>}
                  </ControlButton>
                )}
                <ControlButton
                  onClick={stepHandlerWrapper(onStepBackward)}
                  hotkey={settings?.stepBackHotkey}
                  disabled={startReached}
                >
                  <IconChevronLeft/>
                </ControlButton>
              </>
            )}
            alt={(
              <>
                <ControlButton
                  onClick={() => onRewind?.()}
                  disabled={startReached}
                  hotkey={settings?.skipToBeginning}
                >
                  <IconRewind/>
                </ControlButton>
                <ControlButton
                  onClick={() => onRewind?.(10)}
                  disabled={startReached}
                  hotkey={settings?.hopBackward}
                >
                  <IconBackward/>
                </ControlButton>
              </>
            )}
          />
          <ControlButton onClick={() => onPlayToggle?.(!playing)} hotkey={settings?.playpauseHotkey}>
            {playing ? <IconPause/> : <IconPlay/>}
          </ControlButton>
          <AltControls
            showAlterantive={altControlsMode && !disableFrames}
            main={(
              <>
                <ControlButton
                  onClick={stepHandlerWrapper(onStepForward)}
                  hotkey={settings?.stepForwardHotkey}
                  disabled={endReached}
                >
                  <IconChevronRight/>{}
                </ControlButton>
                {settings?.stepSize && !disableFrames && (
                  <ControlButton
                    disabled={endReached}
                    onClick={stepHandlerWrapper(onStepForward, settings.stepSize)}
                    hotkey={settings?.stepAltForward}
                  >
                    <IconNext/>
                  </ControlButton>
                )}
              </>
            )}
            alt={(
              <>
                <ControlButton
                  onClick={() => onForward?.(10)}
                  disabled={endReached}
                  hotkey={settings?.hopForward}
                >
                  <IconForward/>
                </ControlButton>
                <ControlButton
                  onClick={() => onForward?.()}
                  disabled={endReached}
                  hotkey={settings?.skipToEnd}
                >
                  <IconFastForward/>
                </ControlButton>
              </>
            )}
          />
        </Elem>
        <Elem name="group" tag={Space} collapsed>
          {!disableFrames && (
            <ControlButton tooltip="Toggle Timeline" onClick={() => onToggleCollapsed?.(!collapsed)}>
              {collapsed ? <IconExpand/> : <IconCollapse/>}
            </ControlButton>
          )}
          <ControlButton  tooltip="Fullscreen" onClick={() => onFullScreenToggle?.(false)}>
            {fullscreen ? (
              <IconFullscreenExit/>
            ) : (
              <IconFullscreen/>
            )}
          </ControlButton>
        </Elem>
      </Elem>

      <Elem name="group" tag={Space} size="small">

        <Elem name="time">
          <Time
            time={currentTime}
            position={relativePosition(position, frameRate)}
          />/<Time
            time={time}
            position={relativePosition(length, frameRate)}
          />
        </Elem>
      </Elem>
    </Block>
  );
};

export const ControlButton: FC<ButtonProps & {disabled?: boolean}> = ({ children, ...props }) => {
  return (
    <Button
      {...props}
      type="text"
      style={{ width: 36, height: 36, padding: 0 }}
    >
      {children}
    </Button>
  );
};

const Time: FC<{time: number, position: string}> = ({ time, position }) => {
  const timeDate = new Date(time * 1000).toISOString();
  const formatted = time > 3600
    ? timeDate.substr(11, 8)
    : timeDate.substr(14, 5);

  return (
    <Block name="timeline-time">
      {formatted}{position ? <span>{position}</span> : null}
    </Block>
  );
};

type AltControlsProps = {
  showAlterantive: boolean,
  main: JSX.Element,
  alt: JSX.Element,
  hidden?: boolean,
}

const AltControls: FC<AltControlsProps> = (props) => {
  if (props.hidden) return null;
  return props.showAlterantive ? props.alt : props.main;
};

const allowedKeys = [
  'ArrowUp',
  'ArrowDown',
  'Backspace',
  'Delete',
  'Enter',
  /[0-9]/,
];

const FrameInput: FC<{
  position: number,
  length: number,
  onChange: (value: number) => void,
  onFinishEditing: () => void,
}> = ({ length, position, onChange, onFinishEditing }) => {
  const input = useRef<HTMLInputElement>() as MutableRefObject<HTMLInputElement>;

  const notifyChange = (value: number) => {
    onChange?.(clamp(value, 1, length));
  };

  return (
    <input
      type="text"
      ref={input}
      defaultValue={position}
      autoFocus
      onFocus={() => input.current?.select()}
      onKeyDown={(e) => {
        const allowedKey = allowedKeys.find(k => (k instanceof RegExp) ? k.test(e.key) : k === e.key );

        if (!allowedKey && !e.metaKey) e.preventDefault();

        const value = parseInt(input.current!.value);
        const step = e.shiftKey ? 10 : 1;

        if (e.key === 'Enter') {
          notifyChange?.(value);
          onFinishEditing?.();
        } else if (e.key === 'Escape') {
          onFinishEditing?.();
        } else if (allowedKey === 'ArrowUp') {
          input.current!.value = (clamp(value + step, 1, length)).toString();
          e.preventDefault();
        } else if (allowedKey === 'ArrowDown') {
          input.current!.value = (clamp(value - step, 1, length)).toString();
          e.preventDefault();
        }
      }}
      onBlur={() => onFinishEditing?.()}
    />
  );
};

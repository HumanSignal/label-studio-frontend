import { Block, Elem } from "../../utils/bem";
import { Button, ButtonProps } from "../../common/Button/Button";
import { Space } from "../../common/Space/Space";

import { IconChevronLeft, IconChevronRight, IconCollapse, IconExpand, IconForward, IconFullscreen, IconFullscreenExit, IconNext, IconPause, IconPlay, IconPrev, IconRewind } from "../../assets/icons/timeline";

import "./Controls.styl";
import React, { DOMAttributes, FC, MouseEventHandler, MutableRefObject, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "../../utils/utilities";
import { TimelineContextValue } from "./Types";
import { TimelineContext } from "./Context";

const relativePosition = (pos: number, fps: number) => {
  const roundedFps = Math.floor(fps);
  const value = Math.floor(pos % roundedFps);
  const result = Math.floor(value > 0 ? value : roundedFps);

  return result.toString().padStart(roundedFps.toString().length, '0');
};

export interface ControlsProps {
  length: number;
  position: number;
  frameRate: number;
  playing: boolean;
  collapsed: boolean;
  fullscreen: boolean;
  disableFrames?: boolean;
  extraControls?: JSX.Element | null;
  onRewind: () => void;
  onForward: () => void;
  onPlayToggle: (playing: boolean) => void;
  onFullScreenToggle: (fullscreen: boolean) => void;
  onStepBackward: MouseEventHandler<HTMLButtonElement>;
  onStepForward: MouseEventHandler<HTMLButtonElement>;
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
  const [steppedControlsAlt, setSteppedControlsAlt] = useState(false);
  const [inputMode, setInputMode] = useState(false);

  const time = useMemo(() => {
    return length / frameRate;
  }, [length, frameRate]);

  const currentTime = useMemo(() => {
    return position / frameRate;
  }, [position, frameRate]);

  useEffect(() => {
    const keyboardHandler = (e: KeyboardEvent) => {
      if (!settings?.altStepHandler) return;

      if (e.type === 'keydown' && e.shiftKey) {
        setSteppedControlsAlt(true);
      } else if (e.type === 'keyup' && steppedControlsAlt) {
        setSteppedControlsAlt(false);
      }
    };

    document.addEventListener('keydown', keyboardHandler, { capture: true });
    document.addEventListener('keyup', keyboardHandler, { capture: true });

    return () => {
      document.removeEventListener('keydown', keyboardHandler, { capture: true });
      document.removeEventListener('keyup', keyboardHandler, { capture: true });
    };
  }, [steppedControlsAlt]);

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
        <Elem name="hll"></Elem>
        <Elem name="actions" tag={Space} collapsed>
          <ControlButton onClick={onStepBackward} hotkey={settings?.stepBackHotkey ?? "left"}>
            {steppedControlsAlt ? <IconPrev/> : <IconChevronLeft/>}
          </ControlButton>
          <ControlButton onClick={onStepForward} hotkey={settings?.stepForwardHotkey ?? "right"}>
            {steppedControlsAlt ? <IconNext/> : <IconChevronRight/>}
          </ControlButton>
          {extraControls}
        </Elem>
      </Elem>

      <Elem name="group" tag={Space} collapsed>
        <ControlButton onClick={() => onRewind?.()}><IconRewind/></ControlButton>
        <ControlButton onClick={() => onPlayToggle?.(!playing)}>{playing ? <IconPause/> : <IconPlay/>}</ControlButton>
        <ControlButton onClick={() => onForward?.()}><IconForward/></ControlButton>
      </Elem>

      <Elem name="group" tag={Space} size="small">
        {!disableFrames && (
          <ControlButton onClick={() => onToggleCollapsed?.(!collapsed)}>{collapsed ? <IconExpand/> : <IconCollapse/>}</ControlButton>
        )}

        <Elem name="time">
          <Time
            time={currentTime}
            position={relativePosition(position, frameRate)}
          />/<Time
            time={time}
            position={relativePosition(length, frameRate)}
          />
        </Elem>
        <ControlButton onClick={() => onFullScreenToggle?.(false)}>
          {fullscreen ? (
            <IconFullscreenExit/>
          ) : (
            <IconFullscreen/>
          )}
        </ControlButton>
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
  const formatted = new Date(time * 1000).toISOString().substr(11, 8);

  return (
    <Block name="timeline-time">
      {formatted}{position ? <span>:{position}</span> : null}
    </Block>
  );
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

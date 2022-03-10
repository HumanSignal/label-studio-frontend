import React, { FC, MouseEvent, useContext, useEffect, useMemo, useState } from "react";
import { IconBackward, IconChevronLeft, IconChevronRight, IconCollapse, IconExpand, IconFastForward, IconForward, IconFullscreen, IconFullscreenExit, IconNext, IconPause, IconPlay, IconPrev, IconRewind } from "../../assets/icons/timeline";
import { Button, ButtonProps } from "../../common/Button/Button";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import { TimelineContext } from "./Context";
import "./Controls.styl";
import * as SideControls from "./SideControls";
import { TimelineControlsProps, TimelineControlsStepHandler, TimelineProps, TimelineStepFunction } from "./Types";

const relativePosition = (pos: number, fps: number) => {
  const roundedFps = Math.floor(fps);
  const value = Math.floor(pos % roundedFps);
  const result = Math.floor(value > 0 ? value : roundedFps);

  return result.toString().padStart(roundedFps.toString().length, '0');
};

export const Controls: FC<TimelineControlsProps> = ({
  length,
  position,
  frameRate,
  playing,
  collapsed,
  extraControls,
  fullscreen,
  disableFrames,
  allowFullscreen,
  allowViewCollapse,
  onRewind,
  onForward,
  onPlayToggle,
  onFullScreenToggle,
  onStepBackward,
  onPositionChange,
  onStepForward,
  onToggleCollapsed,
  formatPosition,
  ...props
}) => {
  const { settings } = useContext(TimelineContext);
  const [altControlsMode, setAltControlsMode] = useState(false);
  const [startReached, endReached] = [position === 1, position === length];

  const duration = useMemo(() => {
    return length / frameRate;
  }, [length, frameRate]);

  const currentTime = useMemo(() => {
    return position / frameRate;
  }, [position, frameRate]);

  const stepHandlerWrapper = (handler: TimelineControlsStepHandler, stepSize?: TimelineStepFunction) => (e: MouseEvent<HTMLButtonElement>) => {
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
        {props.controls && Object.entries(props.controls).map(([name, enabled]) => {
          if (enabled === false) return;

          const Component = SideControls[name as keyof typeof SideControls];

          return (
            <Component
              key={name}
              length={length}
              position={position}
              volume={props.volume}
              onPositionChange={onPositionChange}
              onVolumeChange={props.onVolumeChange}
            />
          );
        })}
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
                >
                  <IconRewind/>
                </ControlButton>
                <ControlButton
                  onClick={() => onRewind?.()}
                  disabled={startReached}
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
                  onClick={() => onForward?.()}
                  disabled={endReached}
                >
                  <IconForward/>
                </ControlButton>
                <ControlButton
                  onClick={() => onForward?.()}
                  disabled={endReached}
                >
                  <IconFastForward/>
                </ControlButton>
              </>
            )}
          />
        </Elem>
        <Elem name="group" tag={Space} collapsed>
          {!disableFrames && allowViewCollapse && (
            <ControlButton
              onClick={() => onToggleCollapsed?.(!collapsed)}
            >
              {collapsed ? <IconExpand/> : <IconCollapse/>}
            </ControlButton>
          )}
          {allowFullscreen && (
            <ControlButton onClick={() => onFullScreenToggle?.(false)}>
              {fullscreen ? (
                <IconFullscreenExit/>
              ) : (
                <IconFullscreen/>
              )}
            </ControlButton>
          )}
        </Elem>
      </Elem>

      <Elem name="group" tag={Space} size="small">
        <TimeDisplay
          currentTime={currentTime}
          duration={duration}
          length={length}
          position={position}
          framerate={frameRate}
          formatPosition={formatPosition}
        />
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

interface TimeDisplay {
  currentTime: number;
  position: number;
  duration: number;
  framerate: number;
  length: number;
  formatPosition?: TimelineProps["formatPosition"];
}

const TimeDisplay: FC<TimeDisplay> = ({
  currentTime,
  position,
  duration,
  framerate,
  length,
  formatPosition,
}) => {
  const formatter = formatPosition ?? relativePosition;

  return (
    <Elem name="time">
      <Elem name="time-section">
        <Time
          time={currentTime}
          position={formatter(position, framerate)}
        />
      </Elem>
      <Elem name="time-section">
        <Time
          time={duration}
          position={formatter(length, framerate)}
        />
      </Elem>
    </Elem>
  );
};

const Time: FC<{time: number, position: string}> = ({ time, position }) => {
  const timeDate = new Date(time * 1000).toISOString();
  const formatted = time > 3600
    ? timeDate.substr(11, 8)
    : timeDate.substr(14, 5);

  return (
    <>
      {formatted}{position ? <span>{position}</span> : null}
    </>
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


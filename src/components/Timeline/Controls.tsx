import { Block, Elem } from "../../utils/bem";
import { Button } from "../../common/Button/Button";
import { Space } from "../../common/Space/Space";

import { IconChevronLeft, IconChevronRight, IconForward, IconFullscreen, IconInterpolationDisabled, IconKeyframeAdd, IconPlay, IconRewind } from "../../assets/icons/timeline";

import "./Controls.styl";
import { DOMAttributes, FC, MouseEventHandler, useMemo } from "react";

const relativePosition = (pos: number, fps: number) => {
  const value = Math.round(pos % fps);
  const result = value > 0 ? value : fps;

  return result.toString().padStart(fps.toString().length, '0');
};

export interface ControlsProps {
  length: number,
  position: number,
  frameRate: number,
  onRewind: () => void,
  onForward: () => void,
  onPlayToggle: (playing: boolean) => void
  onFullScreenToggle: (fullscreen: boolean) => void
  onFrameBackward: MouseEventHandler<HTMLButtonElement>
  onFrameForward: MouseEventHandler<HTMLButtonElement>
  onKeyframeAdd: () => void
  onKeyframeRemove: () => void
  onInterpolationDelete: () => void
}

export const Controls: FC<ControlsProps> = ({
  length,
  position,
  frameRate,
  onRewind,
  onForward,
  onPlayToggle,
  onFullScreenToggle,
  onFrameBackward,
  onFrameForward,
  onKeyframeAdd,
  onKeyframeRemove,
  onInterpolationDelete,
}) => {
  const time = useMemo(() => {
    return length / frameRate;
  }, [length, frameRate]);

  const currentTime = useMemo(() => {
    return position / frameRate;
  }, [position, frameRate]);

  return (
    <Block name="timeline-controls" tag={Space} spread>
      <Elem name="group"  tag={Space} size="small">
        <Elem name="counter">
          {position} <span>of {length}</span>
        </Elem>
        <Elem name="actions" tag={Space} collapsed>
          <ControlButton onClick={onFrameBackward}><IconChevronLeft/></ControlButton>
          <ControlButton onClick={onFrameForward}><IconChevronRight/></ControlButton>
          <ControlButton onClick={onKeyframeAdd}><IconKeyframeAdd/></ControlButton>
          <ControlButton onClick={onInterpolationDelete} disabled><IconInterpolationDisabled/></ControlButton>
        </Elem>
      </Elem>

      <Elem name="group" tag={Space} collapsed>
        <ControlButton onClick={() => onRewind?.()}><IconRewind/></ControlButton>
        <ControlButton onClick={() => onPlayToggle?.(false)}><IconPlay/></ControlButton>
        <ControlButton onClick={() => onForward?.()}><IconForward/></ControlButton>
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
        <ControlButton onClick={() => onFullScreenToggle?.(false)}>
          <IconFullscreen/>
        </ControlButton>
      </Elem>
    </Block>
  );
};

const ControlButton: FC<DOMAttributes<HTMLButtonElement> & {disabled?: boolean}> = ({ children, ...props }) => {
  return (
    <Button
      {...props}
      type="text"
      look="link"
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

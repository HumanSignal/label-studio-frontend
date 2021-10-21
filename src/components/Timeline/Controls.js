import { Block, Elem } from "../../utils/bem";
import { Button } from "../../common/Button/Button";
import { Space } from "../../common/Space/Space";

import { IconChevronLeft, IconChevronRight, IconForward, IconFullscreen, IconInterpolationDisabled, IconKeyframeAdd, IconPlay, IconRewind } from "../../assets/icons/timeline";

import "./Controls.styl";
import { useMemo } from "react";

const relativePosition = (pos, fps) => {
  const value = pos % fps;
  const result = value > 0 ? value : fps;

  return result.toString().padStart(fps.toString().length, '0');
};

export const Controls = ({
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
        <ControlButton onClick={onRewind}><IconRewind/></ControlButton>
        <ControlButton onClick={onPlayToggle}><IconPlay/></ControlButton>
        <ControlButton onClick={onForward}><IconForward/></ControlButton>
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
        <ControlButton onClick={onFullScreenToggle}>
          <IconFullscreen/>
        </ControlButton>
      </Elem>
    </Block>
  );
};

const ControlButton = ({ children, ...props }) => {
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

const Time = ({ time, position }) => {
  const formatted = new Date(time * 1000).toISOString().substr(11, 8);

  return (
    <Block name="timeline-time">
      {formatted}{position ? <span>:{position}</span> : null}
    </Block>
  );
};

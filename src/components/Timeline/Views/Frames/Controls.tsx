import { FC, MouseEvent, useContext, useMemo } from "react";
import { IconInterpolationAdd, IconInterpolationDisabled, IconInterpolationRemove, IconKeyframeAdd, IconKeyframeDelete } from "../../../../assets/icons/timeline";
import { isDefined } from "../../../../utils/utilities";
import { TimelineContext } from "../../Context";
import { ControlButton } from "../../Controls";
import { TimelineExtraControls } from "../../Types";

type Actions = "keyframe_add" | "keyframe_remove" | "lifespan_add" | "lifespan_remove"
type DataType = {
  frame: number,
}

export const Controls: FC<TimelineExtraControls<Actions, DataType>> = ({
  onAction,
}) => {
  const { position, regions } = useContext(TimelineContext);
  const closestKeyframe = useMemo(() => {
    const region = regions[0];//.find(r => r.selected);

    return region?.keyframes.filter(({ frame }) => frame <= position).slice(-1)[0];
  }, [regions, position]);

  const onKeyframeAdd = (e: MouseEvent) => {
    onAction?.(e, 'keyframe_add', {
      frame: position,
    });
  };

  const onKeyframeRemove = (e: MouseEvent) => {
    onAction?.(e, 'keyframe_remove', {
      frame: closestKeyframe!.frame,
    });
  };

  const onLifespanAdd = (e: MouseEvent) => {
    onAction?.(e, 'lifespan_add', {
      frame: closestKeyframe!.frame,
    });
  };

  const onLifespanRemove = (e: MouseEvent) => {
    onAction?.(e, 'lifespan_remove', {
      frame: closestKeyframe!.frame,
    });
  };

  const canAddKeyframe = closestKeyframe?.frame !== position;
  const canAddInterpolation = closestKeyframe?.enabled === true;

  const keypointIcon = useMemo(() => {
    if (canAddKeyframe) {
      return <IconKeyframeAdd/>;
    }

    return <IconKeyframeDelete/>;
  }, [canAddKeyframe, closestKeyframe]);

  const interpolationIcon = useMemo(() => {
    if (!isDefined(closestKeyframe)) {
      return <IconInterpolationDisabled/>;
    } else if (canAddInterpolation) {
      return <IconInterpolationAdd/>;
    }

    return <IconInterpolationRemove/>;
  }, [closestKeyframe, canAddInterpolation]);

  return (
    <>
      <ControlButton
        onClick={canAddKeyframe ? onKeyframeAdd : onKeyframeRemove}
        disabled={!closestKeyframe}
      >{keypointIcon}</ControlButton>
      <ControlButton
        onClick={canAddInterpolation ? onLifespanAdd : onLifespanRemove}
        disabled={!closestKeyframe}
      >{interpolationIcon}</ControlButton>
    </>
  );
};

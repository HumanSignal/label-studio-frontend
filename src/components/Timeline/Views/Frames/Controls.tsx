import { FC, MouseEvent, useMemo } from "react";
import { IconInterpolationAdd, IconInterpolationDisabled, IconInterpolationRemove, IconKeyframeAdd, IconKeyframeDelete } from "../../../../assets/icons/timeline";
import { isDefined } from "../../../../utils/utilities";
import { ControlButton } from "../../Controls";
import { TimelineExtraControls } from "../../Types";


export const Controls: FC<TimelineExtraControls> = ({
  position,
  regions,
  onAction,
}) => {
  const closestKeyframe = useMemo(() => {
    const region = regions[0];//.find(r => r.selected);

    return region?.keyframes.filter(({ frame }) => frame <= position).slice(-1)[0];
  }, [regions, position]);

  const onKeyframeAdd = (e: MouseEvent) => {
    onAction?.(e, 'keyframe_add');
  };

  const onInterpolationDelete = (e: MouseEvent) => {
    onAction?.(e, 'interpolation_delete');
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
        onClick={onKeyframeAdd}
        disabled={!closestKeyframe}
      >{keypointIcon}</ControlButton>
      <ControlButton
        onClick={onInterpolationDelete}
        disabled={!closestKeyframe}
      >{interpolationIcon}</ControlButton>
    </>
  );
};

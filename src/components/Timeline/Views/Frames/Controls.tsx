import { FC, MouseEvent, useContext, useMemo } from "react";
import { IconInterpolationAdd, IconInterpolationDisabled, IconInterpolationRemove, IconKeypointAdd, IconKeypointDelete, IconKeypointDisabled } from "../../../../assets/icons/timeline";
import { isDefined } from "../../../../utils/utilities";
import { TimelineContext } from "../../Context";
import { ControlButton } from "../../Controls";
import { TimelineExtraControls } from "../../Types";

type Actions = "keypoint_add" | "keypoint_remove" | "lifespan_add" | "lifespan_remove"
type DataType = {
  frame: number,
}

export const Controls: FC<TimelineExtraControls<Actions, DataType>> = ({
  onAction,
}) => {
  const { position, regions } = useContext(TimelineContext);
  const closestKeypoint = useMemo(() => {
    const region = regions.find(r => r.selected);

    return region?.sequence.filter(({ frame }) => frame <= position).slice(-1)[0];
  }, [regions, position]);

  const onKeypointAdd = (e: MouseEvent) => {
    onAction?.(e, 'keypoint_add', {
      frame: position,
    });
  };

  const onKeypointRemove = (e: MouseEvent) => {
    onAction?.(e, 'keypoint_remove', {
      frame: closestKeypoint!.frame,
    });
  };

  const onLifespanAdd = (e: MouseEvent) => {
    onAction?.(e, 'lifespan_add', {
      frame: closestKeypoint!.frame,
    });
  };

  const onLifespanRemove = (e: MouseEvent) => {
    onAction?.(e, 'lifespan_remove', {
      frame: closestKeypoint!.frame,
    });
  };

  const canAddKeypoint = closestKeypoint?.frame !== position;
  const canAddInterpolation = closestKeypoint?.enabled === false;

  const keypointIcon = useMemo(() => {
    if (!isDefined(closestKeypoint)) {
      return <IconKeypointDisabled/>;
    } else if (canAddKeypoint) {
      return <IconKeypointAdd/>;
    }

    return <IconKeypointDelete/>;
  }, [canAddKeypoint, closestKeypoint]);

  const interpolationIcon = useMemo(() => {
    if (!isDefined(closestKeypoint)) {
      return <IconInterpolationDisabled/>;
    } else if (canAddInterpolation) {
      return <IconInterpolationAdd/>;
    }

    return <IconInterpolationRemove/>;
  }, [closestKeypoint, canAddInterpolation]);

  return (
    <>
      <ControlButton
        onClick={canAddKeypoint ? onKeypointAdd : onKeypointRemove}
        disabled={!closestKeypoint}
      >{keypointIcon}</ControlButton>
      <ControlButton
        onClick={canAddInterpolation ? onLifespanAdd : onLifespanRemove}
        disabled={!closestKeypoint}
      >{interpolationIcon}</ControlButton>
    </>
  );
};

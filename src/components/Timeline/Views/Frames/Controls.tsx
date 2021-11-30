import { FC, MouseEvent, useContext, useMemo } from "react";
import { IconInterpolationAdd, IconInterpolationRemove, IconKeypointAdd, IconKeypointDelete } from "../../../../assets/icons/timeline";
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
  const hasSelectedRegion = regions.some(({ selected }) => selected);
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
    if (canAddKeypoint) {
      return <IconKeypointAdd/>;
    }

    return <IconKeypointDelete/>;
  }, [canAddKeypoint, closestKeypoint]);

  const interpolationIcon = useMemo(() => {
    if (canAddInterpolation) {
      return <IconInterpolationAdd/>;
    }

    return <IconInterpolationRemove/>;
  }, [closestKeypoint, canAddInterpolation]);

  return (
    <>
      <ControlButton
        onClick={canAddKeypoint ? onKeypointAdd : onKeypointRemove}
        disabled={!hasSelectedRegion}
      >{keypointIcon}</ControlButton>
      <ControlButton
        onClick={canAddInterpolation ? onLifespanAdd : onLifespanRemove}
        disabled={!closestKeypoint}
      >{interpolationIcon}</ControlButton>
    </>
  );
};

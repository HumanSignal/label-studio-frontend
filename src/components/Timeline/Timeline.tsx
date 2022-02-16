import { Block, Elem } from "../../utils/bem";
import { Controls, ControlsStepHandler } from "./Controls";
import { Seeker } from "./Seeker";
import { FC, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { default as Views, ViewTypes } from "./Views";

import "./Timeline.styl";
import { clamp, isDefined } from "../../utils/utilities";
import { TimelineContextProvider } from "./Context";
import { TimelineContextValue, TimelineStepFunction } from "./Types";

export interface TimelineProps<D extends ViewTypes = "frames"> {
  regions: any[];
  length: number;
  position: number;
  mode: D;
  framerate: number;
  playing: boolean;
  zoom?: number;
  fullscreen?: boolean;
  disableFrames?: boolean;
  className?: string;
  defaultStepSize?: number;
  onPlayToggle: (playing: boolean) => void;
  onPositionChange: (value: number) => void;
  onToggleVisibility?: (id: string, visibility: boolean) => void;
  onDeleteRegion?: (id: string) => void;
  onSelectRegion?: (event: MouseEvent<HTMLDivElement>, id: string, select?: boolean) => void;
  onAction?: (event: MouseEvent, action: string, data?: any) => void;
  onFullscreenToggle?: () => void;
}

export const Timeline: FC<TimelineProps> = ({
  regions,
  zoom = 1,
  mode = "frames",
  length = 1024,
  position = 1,
  framerate = 24,
  playing = false,
  fullscreen = false,
  disableFrames = false,
  defaultStepSize = 10,
  className,
  onPlayToggle,
  onPositionChange,
  onToggleVisibility,
  onDeleteRegion,
  onSelectRegion,
  onAction,
  onFullscreenToggle,
}) => {
  const View = Views[mode];

  const [currentPosition, setCurrentPosition] = useState(clamp(position, 1, Infinity));
  const [seekOffset, setSeekOffset] = useState(0);
  const [seekVisibleWidth, setSeekVisibleWidth] = useState(0);
  const [viewCollapsed, setViewCollapsed] = useState(false);
  const step = useMemo(() => defaultStepSize * zoom, [zoom, defaultStepSize]);

  const setInternalPosition = (newPosition: number) => {
    const clampedValue = clamp(newPosition, 1, length);

    if (clampedValue !== currentPosition) {
      setCurrentPosition(clampedValue);
      onPositionChange?.(clampedValue);
    }
  };

  const increasePosition: ControlsStepHandler = (_, stepSize) => {
    const nextPosition = stepSize?.(length, currentPosition, regions, 1) ?? currentPosition + 1;

    setInternalPosition(nextPosition);
  };

  const decreasePosition: ControlsStepHandler = (_, stepSize) => {
    const nextPosition = stepSize?.(length, currentPosition, regions, -1) ?? currentPosition - 1;

    setInternalPosition(nextPosition);
  };

  const contextValue: TimelineContextValue = {
    position,
    length,
    regions,
    step,
    playing,
    seekOffset,
    settings: View.settings,
    visibleWidth: seekVisibleWidth,
  };

  useEffect(() => {
    setCurrentPosition(clamp(position, 1, length));
  }, [position, length]);

  return (
    <TimelineContextProvider value={contextValue}>
      <Block name="timeline" className={className}>
        <Elem name="topbar">
          <Controls
            length={length}
            position={currentPosition}
            frameRate={framerate}
            playing={playing}
            collapsed={viewCollapsed}
            onPlayToggle={onPlayToggle}
            fullscreen={fullscreen}
            disableFrames={disableFrames}
            onFullScreenToggle={() => onFullscreenToggle?.()}
            onStepBackward={decreasePosition}
            onStepForward={increasePosition}
            onRewind={(steps) => setInternalPosition(isDefined(steps) ? currentPosition - steps : 0)}
            onForward={(steps) => setInternalPosition(isDefined(steps) ? currentPosition + steps : length)}
            onPositionChange={setInternalPosition}
            onToggleCollapsed={setViewCollapsed}
            extraControls={View.Controls && !disableFrames ? (
              <View.Controls
                onAction={(e, action, data) => {
                  onAction?.(e, action, data);
                }}
              />
            ) : null}
          />

          <Seeker
            length={length}
            position={currentPosition}
            seekOffset={seekOffset}
            seekVisible={seekVisibleWidth}
            onIndicatorMove={setSeekOffset}
            onSeek={setInternalPosition}
            minimap={View.Minimap ? (
              <View.Minimap/>
            ): null}
          />
        </Elem>

        {!viewCollapsed && !disableFrames && (
          <Elem name="view">
            <View.View
              step={step}
              length={length}
              regions={regions}
              playing={playing}
              position={currentPosition}
              offset={seekOffset}
              onScroll={setSeekOffset}
              onResize={setSeekVisibleWidth}
              onChange={setInternalPosition}
              onToggleVisibility={onToggleVisibility}
              onDeleteRegion={onDeleteRegion}
              onSelectRegion={onSelectRegion}
            />
          </Elem>
        )}
      </Block>
    </TimelineContextProvider>
  );
};

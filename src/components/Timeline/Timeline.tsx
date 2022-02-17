import { observer } from "mobx-react";
import { FC, useEffect, useMemo, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { clamp } from "../../utils/utilities";
import { TimelineContextProvider } from "./Context";
import { Controls, ControlsStepHandler } from "./Controls";
import { Seeker } from "./Seeker";
import "./Timeline.styl";
import { TimelineContextValue, TimelineProps } from "./Types";
import { default as Views } from "./Views";

const TimelineComponent: FC<TimelineProps> = ({
  regions,
  zoom = 1,
  mode = "frames",
  length = 1024,
  position = 1,
  framerate = 24,
  hopSize = 1,
  playing = false,
  fullscreen = false,
  disableView = false,
  defaultStepSize = 10,
  displaySeeker = true,
  allowFullscreen = true,
  allowViewCollapse = true,
  data,
  className,
  onReady,
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
    const nextPosition = stepSize?.(length, currentPosition, regions, 1) ?? currentPosition + hopSize;

    setInternalPosition(nextPosition);
  };

  const decreasePosition: ControlsStepHandler = (_, stepSize) => {
    const nextPosition = stepSize?.(length, currentPosition, regions, -1) ?? currentPosition - hopSize;

    setInternalPosition(nextPosition);
  };

  const contextValue = useMemo<TimelineContextValue>(() => ({
    position,
    length,
    regions,
    step,
    data,
    playing,
    settings: View.settings,
  }), [position, length, regions, step, playing, View.settings, data]);

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
            disableFrames={disableView}
            allowFullscreen={allowFullscreen}
            allowViewCollapse={allowViewCollapse}
            onFullScreenToggle={() => onFullscreenToggle?.()}
            onStepBackward={decreasePosition}
            onStepForward={increasePosition}
            onRewind={() => setInternalPosition(0)}
            onForward={() => setInternalPosition(length)}
            onPositionChange={setInternalPosition}
            onToggleCollapsed={setViewCollapsed}
            extraControls={View.Controls && !disableView ? (
              <View.Controls
                onAction={(e, action, data) => {
                  onAction?.(e, action, data);
                }}
              />
            ) : null}
          />

          {displaySeeker && (
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
          )}
        </Elem>

        {!viewCollapsed && !disableView && (
          <Elem name="view">
            <View.View
              step={step}
              length={length}
              regions={regions}
              playing={playing}
              position={currentPosition}
              offset={seekOffset}
              onReady={onReady}
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

export const Timeline = observer(TimelineComponent);

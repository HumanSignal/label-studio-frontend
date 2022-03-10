import { observer } from "mobx-react";
import { FC, useEffect, useMemo, useState } from "react";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { Block, Elem } from "../../utils/bem";
import { clamp } from "../../utils/utilities";
import { TimelineContextProvider } from "./Context";
import { Controls } from "./Controls";
import { Seeker } from "./Seeker";
import "./Timeline.styl";
import { TimelineContextValue, TimelineControlsStepHandler, TimelineProps } from "./Types";
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
  allowSeek = true,
  allowFullscreen = true,
  allowViewCollapse = true,
  controlsOnTop = true,
  data,
  speed,
  className,
  onReady,
  onPlayToggle,
  onPositionChange,
  onToggleVisibility,
  onAddRegion,
  onDeleteRegion,
  onSelectRegion,
  onAction,
  onFullscreenToggle,
  onSpeedChange,
  formatPosition,
  ...props
}) => {
  const View = Views[mode];

  const [currentPosition, setCurrentPosition] = useState(clamp(position, 1, Infinity));
  const [seekOffset, setSeekOffset] = useState(0);
  const [seekVisibleWidth, setSeekVisibleWidth] = useState(0);
  const [viewCollapsed, setViewCollapsed] = useLocalStorageState("video-timeline", false, {
    fromString(value) { return value === "true" ? true : false; },
    toString(value) { return String(value); },
  });
  const step = useMemo(() => defaultStepSize * zoom, [zoom, defaultStepSize]);

  const setInternalPosition = (newPosition: number) => {
    const clampedValue = clamp(newPosition, 1, length);

    if (clampedValue !== currentPosition) {
      setCurrentPosition(clampedValue);
      onPositionChange?.(clampedValue);
    }
  };

  const increasePosition: TimelineControlsStepHandler = (_, stepSize) => {
    const nextPosition = stepSize?.(length, currentPosition, regions, 1) ?? currentPosition + hopSize;

    setInternalPosition(nextPosition);
  };

  const decreasePosition: TimelineControlsStepHandler = (_, stepSize) => {
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

  const controls = (
    <Elem name="topbar">
      <Controls
        length={length}
        position={currentPosition}
        frameRate={framerate}
        playing={playing}
        volume={props.volume}
        controls={props.controls}
        collapsed={viewCollapsed}
        onPlayToggle={onPlayToggle}
        fullscreen={fullscreen}
        disableFrames={disableView}
        allowFullscreen={allowFullscreen}
        allowViewCollapse={allowViewCollapse}
        onFullScreenToggle={onFullscreenToggle}
        onVolumeChange={props.onVolumeChange}
        onStepBackward={decreasePosition}
        onStepForward={increasePosition}
        onRewind={() => setInternalPosition(0)}
        onForward={() => setInternalPosition(length)}
        onPositionChange={setInternalPosition}
        onToggleCollapsed={setViewCollapsed}
        formatPosition={formatPosition}
        extraControls={View.Controls && !disableView ? (
          <View.Controls
            onAction={(e, action, data) => {
              onAction?.(e, action, data);
            }}
          />
        ) : null}
      />

      {allowSeek && (
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
  );

  const view = !viewCollapsed && !disableView && (
    <Elem name="view">
      <View.View
        step={step}
        length={length}
        regions={regions}
        playing={playing}
        zoom={zoom}
        speed={speed}
        volume={props.volume}
        position={currentPosition}
        offset={seekOffset}
        onReady={onReady}
        onScroll={setSeekOffset}
        onResize={setSeekVisibleWidth}
        onChange={setInternalPosition}
        onPlayToggle={onPlayToggle}
        onToggleVisibility={onToggleVisibility}
        onAddRegion={onAddRegion}
        onDeleteRegion={onDeleteRegion}
        onSelectRegion={onSelectRegion}
        onSpeedChange={onSpeedChange}
        onZoom={props.onZoom}
      />
    </Elem>
  );

  return (
    <TimelineContextProvider value={contextValue}>
      <Block name="timeline" className={className}>
        {controlsOnTop ? (
          <>
            {controls}
            {view}
          </>
        ) : (
          <>
            {view}
            {controls}
          </>
        )}
      </Block>
    </TimelineContextProvider>
  );
};

export const Timeline = observer(TimelineComponent);

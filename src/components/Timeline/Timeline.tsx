import { Block, Elem } from "../../utils/bem";
import { Controls } from "./Controls";
import { Seeker } from "./Seeker";
import { FC, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { default as Views, ViewTypes } from "./Views";

import "./Timeline.styl";
import { clamp } from "../../utils/utilities";
import { TimelineContextProvider } from "./Context";
import { TimelineContextValue } from "./Types";

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
  onPlayToggle: (playing: boolean) => void;
  onPositionChange: (value: number) => void;
  onToggleVisibility: (id: string, visibility: boolean) => void;
  onDeleteRegion: (id: string) => void;
  onSelectRegion: (event: MouseEvent<HTMLDivElement>, id: string) => void;
  onAction: (event: MouseEvent, action: string, data?: any) => void;
  onFullscreenToggle: () => void;
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

  const [currentPosition, setCurrentPosition] = useState(position);
  const [seekOffset, setSeekOffset] = useState(0);
  const [seekVisibleWidth, setSeekVisibleWidth] = useState(0);
  const [viewCollapsed, setViewCollapsed] = useState(false);
  const step = useMemo(() => 10 * zoom, [zoom]);

  const onInternalPositionChange = (value: number) => {
    console.log({ value });
    const clampedValue = clamp(value, 1, length);

    if (clampedValue !== currentPosition) {
      console.log({ clampedValue });
      setCurrentPosition(clampedValue);
      onPositionChange?.(clampedValue);
    }
  };

  const increasePosition = () => {
    console.log('increase');
    onInternalPositionChange(currentPosition + 1);
  };

  const decreasePosition = () => {
    console.log('decrease');
    onInternalPositionChange(currentPosition - 1);
  };

  const contextValue: TimelineContextValue = {
    position,
    length,
    regions,
    step,
    playing,
    settings: View.settings,
  };

  useEffect(() => {
    setCurrentPosition(clamp(position, 1, length));
  }, [position, length]);

  return (
    <TimelineContextProvider value={contextValue}>
      <Block name="timeline" className={className}>
        <Elem name="topbar">
          <Seeker
            length={length}
            position={currentPosition}
            seekOffset={seekOffset}
            seekVisible={seekVisibleWidth}
            onIndicatorMove={setSeekOffset}
            onSeek={onInternalPositionChange}
            minimap={View.Minimap ? (
              <View.Minimap/>
            ): null}
          />

          <Controls
            length={length}
            position={currentPosition}
            frameRate={framerate}
            playing={playing}
            collapsed={viewCollapsed}
            onPlayToggle={onPlayToggle}
            fullscreen={fullscreen}
            disableFrames={disableFrames}
            onFullScreenToggle={onFullscreenToggle}
            onStepBackward={decreasePosition}
            onStepForward={increasePosition}
            onRewind={() => onInternalPositionChange(0)}
            onForward={() => onInternalPositionChange(length)}
            onPositionChange={onInternalPositionChange}
            onToggleCollapsed={setViewCollapsed}
            extraControls={View.Controls && !disableFrames ? (
              <View.Controls
                onAction={(e, action, data) => {
                  onAction?.(e, action, data);
                }}
              />
            ) : null}
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
              onChange={onInternalPositionChange}
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

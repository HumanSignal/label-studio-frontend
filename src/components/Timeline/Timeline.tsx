import { Block, Elem } from "../../utils/bem";
import { Controls } from "./Controls";
import { Seeker } from "./Seeker";
import { FC, MouseEvent, useCallback, useContext, useEffect, useState } from "react";
import * as Views from "./Views";

import "./Timeline.styl";
import { TimelineContext } from "./Types";

export interface TimelineProps {
  regions: any[];
  length: number;
  position: number;
  mode: keyof typeof Views;
  framerate: number;
  zoom?: number;
  playing: boolean;
  onPlayToggle: (playing: boolean) => void;
  onPositionChange: (value: number) => void;
  onToggleVisibility: (id: string, visibility: boolean) => void;
  onDeleteRegion: (id: string) => void;
  onSelectRegion: (event: MouseEvent<HTMLDivElement>, id: string) => void;
}

export const Timeline: FC<TimelineProps> = ({
  regions,
  zoom = 1,
  mode = "frames",
  length = 1024,
  position = 1,
  framerate = 24,
  playing = false,
  onPlayToggle,
  onPositionChange,
  onToggleVisibility,
  onDeleteRegion,
  onSelectRegion,
}) => {
  const View = Views[mode];
  const step = 10 * zoom;
  const [currentPosition, setCurrentPosition] = useState(position);
  const [seekOffset, setSeekOffset] = useState(0);
  const [seekVisibleWidth, setSeekVisibleWidth] = useState(0);

  const onInternalPositionChange = useCallback((value: number) => {
    console.log('out', value);
    setCurrentPosition(value);
    onPositionChange?.(value);
  }, [setCurrentPosition]);

  useEffect(() => {
    console.log('in', position);
    setCurrentPosition(position);
  }, [position]);

  return (
    <Block name="timeline">
      <Elem name="topbar">
        <Seeker
          length={length}
          position={currentPosition}
          seekOffset={seekOffset}
          seekVisible={seekVisibleWidth}
          onIndicatorMove={setSeekOffset}
          onSeek={onInternalPositionChange}
        />

        <Controls
          length={length}
          position={currentPosition}
          frameRate={framerate}
          playing={playing}
          onPlayToggle={onPlayToggle}
          onFullScreenToggle={() => {}}
          onInterpolationDelete={() => {}}
          onKeyframeAdd={() => {}}
          onKeyframeRemove={() => {}}
          onFrameBackward={() => onInternalPositionChange(currentPosition - 1)}
          onFrameForward={() => onInternalPositionChange(currentPosition + 1)}
          onRewind={() => onInternalPositionChange(0)}
          onForward={() => onInternalPositionChange(length)}
          onPositionChange={(value) => onInternalPositionChange(value)}
        />
      </Elem>

      <Elem name="view">
        <View.View
          step={step}
          length={length}
          regions={regions}
          offset={seekOffset}
          playing={playing}
          position={currentPosition}
          onScroll={setSeekOffset}
          onResize={setSeekVisibleWidth}
          onChange={onInternalPositionChange}
          onToggleVisibility={onToggleVisibility}
          onDeleteRegion={onDeleteRegion}
          onSelectRegion={onSelectRegion}
        />
      </Elem>
    </Block>
  );
};

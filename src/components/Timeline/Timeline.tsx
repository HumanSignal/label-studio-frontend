import { Block, Elem } from "../../utils/bem";
import { Controls } from "./Controls";
import { Seeker } from "./Seeker";
import { FC, MouseEvent, useEffect, useState } from "react";
import * as Views from "./Views";

import "./Timeline.styl";

export interface TimelineProps {
  regions: any[],
  length: number,
  position: number,
  mode: keyof typeof Views,
  onPositionChange: (value: number) => void,
  onToggleVisibility: (id: string, visibility: boolean) => void
  onDeleteRegion: (id: string) => void,
  onSelectRegion: (event: MouseEvent<HTMLDivElement>, id: string) => void
}

export const Timeline: FC<TimelineProps> = ({
  regions,
  mode = "FramesView",
  length = 1024,
  position = 1,
  onPositionChange,
  onToggleVisibility,
  onDeleteRegion,
  onSelectRegion,
}) => {
  const View = Views[mode];
  const [currentPosition, setCurrentPosition] = useState(position);
  const [seekOffset, setSeekOffset] = useState(0);
  const [seekVisibleWidth, setSeekVisibleWidth] = useState(0);

  const contextValue = useState({});

  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  useEffect(() => {
    if (currentPosition !== position) {
      onPositionChange?.(currentPosition);
    }
  }, [currentPosition, position]);

  return (
    <View.Provider value={contextValue}>
      <Block name="timeline">
        <Elem name="topbar">
          <Seeker
            length={length}
            position={currentPosition}
            seekOffset={seekOffset}
            seekVisible={seekVisibleWidth}
            onIndicatorMove={setSeekOffset}
            onSeek={setCurrentPosition}
          />

          <Controls
            length={length}
            position={currentPosition}
            frameRate={24}
            onPlayToggle={() => {}}
            onFullScreenToggle={() => {}}
            onInterpolationDelete={() => {}}
            onKeyframeAdd={() => {}}
            onKeyframeRemove={() => {}}
            onFrameBackward={() => setCurrentPosition(currentPosition - 1)}
            onFrameForward={() => setCurrentPosition(currentPosition + 1)}
            onRewind={() => setCurrentPosition(0)}
            onForward={() => setCurrentPosition(length)}
          />
        </Elem>

        <Elem name="view">
          <View.View
            step={10}
            length={length}
            regions={regions}
            offset={seekOffset}
            position={currentPosition}
            onScroll={setSeekOffset}
            onChange={setCurrentPosition}
            onResize={setSeekVisibleWidth}
            onToggleVisibility={onToggleVisibility}
            onDeleteRegion={onDeleteRegion}
            onSelectRegion={onSelectRegion}
          />
        </Elem>
      </Block>
    </View.Provider>
  );
};

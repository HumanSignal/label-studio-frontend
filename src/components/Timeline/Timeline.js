import { Block, Elem } from "../../utils/bem";
import { Controls } from "./Controls";
import { Seeker } from "./Seeker";
import { Frames } from "./Views/Frames/Frames";
import { useEffect, useState } from "react";

import "./Timeline.styl";

export const Timeline = ({
  regions,
  length = 1024,
  position = 1,
  onPositionChange,
  onToggleVisibility,
  onDeleteRegion,
}) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [seekOffset, setSeekOffset] = useState(0);
  const [seekVisibleWidth, setSeekVisibleWidth] = useState(0);

  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  useEffect(() => {
    if (currentPosition !== position) {
      onPositionChange?.(currentPosition);
    }
  }, [currentPosition, position]);

  return (
    <Block name="timeline">
      <Elem name="topbar">
        <Seeker
          length={length}
          seek={currentPosition}
          seekOffset={seekOffset}
          seekVisible={seekVisibleWidth}
          onIndicatorMove={setSeekOffset}
          onSeek={setCurrentPosition}
        />

        <Controls
          length={length}
          position={currentPosition}
          frameRate={24}
          onFrameBackward={() => setCurrentPosition(currentPosition - 1)}
          onFrameForward={() => setCurrentPosition(currentPosition + 1)}
          onRewind={() => setCurrentPosition(0)}
          onForward={() => setCurrentPosition(length)}
        />
      </Elem>

      <Elem name="view">
        <Frames
          length={length}
          regions={regions}
          offset={seekOffset}
          position={currentPosition}
          onScroll={setSeekOffset}
          onChange={setCurrentPosition}
          onResize={setSeekVisibleWidth}
          onToggleVisibility={onToggleVisibility}
          onDeleteRegion={onDeleteRegion}
        />
      </Elem>
    </Block>
  );
};

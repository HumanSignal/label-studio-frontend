import { Block, Elem } from "../../utils/bem";
import { Controls } from "./Controls";
import { Seeker } from "./Seeker";
import { Frames } from "./Views/Frames/Frames";
import { useState } from "react";

import "./Timeline.styl";

export const Timeline = ({
  length = 1024,
}) => {
  const [currentPosition, setCurrentPosition] = useState(1);
  const [seekOffset, setSeekOffset] = useState(0);
  const [seekVisibleWidth, setSeekVisibleWidth] = useState(0);

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
          offset={seekOffset}
          position={currentPosition}
          onScroll={setSeekOffset}
          onChange={setCurrentPosition}
          onResize={setSeekVisibleWidth}
        />
      </Elem>
    </Block>
  );
};

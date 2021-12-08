import { TimelineRegion, TimelineView } from "../../Types";

import { Frames } from "./Frames";
import { Minimap } from "./Minimap";
import { Controls } from "./Controls";
import { findClosestKeypoint } from "./Utils";

const getKeyframePosition = (position: number, regions: TimelineRegion[], direction: -1 | 1) => {
  const selectedRegion = regions.find(r => r.selected);
  let frames: number[];

  if (selectedRegion) {
    frames = selectedRegion.sequence.map(({ frame }) => frame);
  } else {
    frames = Array.from(regions.reduce<Set<number>>((res, { sequence }) => {
      const sFrames = sequence.map(({ frame }) => frame);

      return new Set<number>([...res, ...sFrames]);
    }, new Set<number>())).sort((a, b) => a - b);
  }

  return findClosestKeypoint(frames, position, direction);
};

const View: TimelineView<typeof Controls> = {
  View: Frames,
  Minimap,
  Controls,
  settings: {
    stepSize(_, position, regions, direction) {
      return getKeyframePosition(position, regions, direction);
    },
    fastTravelSize() {
      return 10;
    },
    playpauseHotkey: "video:playpause",
    stepBackHotkey: 'video:frame-backward',
    stepForwardHotkey: 'video:frame-forward',
    stepAltBack: "video:keyframe-backward",
    stepAltForward: "video:keyframe-forward",
  },
};

export default View;

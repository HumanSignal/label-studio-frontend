import { TimelineView } from "../../Types";

import { Frames } from "./Frames";
import { Minimap } from "./Minimap";
import { Controls } from "./Controls";

const View: TimelineView<typeof Controls> = {
  View: Frames,
  Minimap,
  Controls,
  settings: {
    altStepHandler() {
      console.log('hello');
    },
    playpauseHotkey: "video:playpause",
    stepBackHotkey: 'video:frame-backward',
    stepForwardHotkey: 'video:frame-forward',
  },
};

export default View;

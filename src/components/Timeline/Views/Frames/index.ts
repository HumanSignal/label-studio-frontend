import { TimelineView } from "../../Types";

import { Frames } from "./Frames";
import { Minimap } from "./Minimap";
import { Controls } from "./Controls";

const View: TimelineView<typeof Controls> = {
  View: Frames,
  Minimap,
  Controls,
};

export default View;

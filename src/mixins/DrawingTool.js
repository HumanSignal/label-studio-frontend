import { types } from "mobx-state-tree";

import Utils from "../utils";
import throttle from "lodash.throttle";

const DrawingTool = types.model("DrawingTool").actions(self => ({
  updateDraw: throttle(function(x, y) {
    const shape = self.getActiveShape;
    const { stageWidth, stageHeight } = self.obj;

    let { x1, y1, x2, y2 } = Utils.Image.reverseCoordinates({ x: shape.startX, y: shape.startY }, { x, y });

    x1 = Math.max(0, x1);
    y1 = Math.max(0, y1);
    x2 = Math.min(stageWidth, x2);
    y2 = Math.min(stageHeight, y2);

    shape.setPosition(x1, y1, x2 - x1, y2 - y1, shape.rotation);
  }, 48), // 3 frames, optimized enough and not laggy yet
}));

export { DrawingTool };

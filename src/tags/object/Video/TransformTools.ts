import { KonvaEventObject } from "konva/lib/Node";
import { Box, Transformer } from "konva/lib/shapes/Transformer";
import { WorkingArea } from "./types";

// define several math function
export const getCorner = (pivotX: number, pivotY: number, diffX: number, diffY: number, angle: number) => {
  const distance = Math.sqrt(diffX * diffX + diffY * diffY);

  /// find angle from pivot to corner
  angle += Math.atan2(diffY, diffX);

  /// get new x and y and round it off to integer
  const x = pivotX + distance * Math.cos(angle);
  const y = pivotY + distance * Math.sin(angle);

  return { x, y };
};

export const getClientRect = (rotatedBox: Box) => {
  const { x, y, width, height } = rotatedBox;
  const rad = rotatedBox.rotation;

  const p1 = getCorner(x, y, 0, 0, rad);
  const p2 = getCorner(x, y, width, 0, rad);
  const p3 = getCorner(x, y, width, height, rad);
  const p4 = getCorner(x, y, 0, height, rad);

  const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
  const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
  const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
  const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const getCommonBBox = (boxes: {
  x: number,
  y: number,
  width: number,
  height: number,
}[]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  boxes.forEach((box) => {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const createBoundingBoxGetter = (workingArea: WorkingArea, enabled = true) => (oldBox: Box, newBox: Box) => {
  if (!enabled) return newBox;

  console.log(newBox);

  const box = getClientRect(newBox);
  const result = { ...newBox };
  const isRotated = newBox.rotation !== 0;

  const edgeReached = [
    (box.x - workingArea.x) < 0,
    (box.y - workingArea.y) < 0,
    (box.x - workingArea.x) + box.width > workingArea.width,
    (box.y - workingArea.y) + box.height > workingArea.height,
  ];

  // When left edge reached
  if (edgeReached[0]) {
    result.x = workingArea.x;
    result.width = oldBox.width + oldBox.x - workingArea.x;
    console.log('reached left');
  }

  // When top edge reached
  if (edgeReached[1]) {
    result.y = workingArea.y;
    result.height = oldBox.height + oldBox.y - workingArea.y;
    console.log('reached top');
  }

  // When right edge reached
  if (edgeReached[2]) {
    result.width = workingArea.width - (box.x - workingArea.x);
    console.log('reached right');
  }

  // When bottom edge reached
  if (edgeReached[3]) {
    result.height = workingArea.height - (box.y - workingArea.y);
    console.log('reached bottom');
  }

  return result;
};

export const createOnDragMoveHandler = (workingArea: WorkingArea, enabled = true) => function(this: Transformer, e: KonvaEventObject<DragEvent>) {
  if (!enabled) return;

  const nodes = this?.nodes ? this.nodes() : [e.target];
  const boxes = nodes.map((node) => node.getClientRect());
  const box = getCommonBBox(boxes);

  nodes.forEach((shape) => {
    const absPos = shape.getAbsolutePosition();
    // where are shapes inside bounding box of all shapes?
    const offsetX = box.x - workingArea.x - absPos.x;
    const offsetY = box.y - workingArea.y - absPos.y;

    // we total box goes outside of viewport, we need to move absolute position of shape
    const newAbsPos = { ...absPos };

    if (box.x - workingArea.x < 0) {
      newAbsPos.x = -offsetX;
    }
    if (box.y - workingArea.y < 0) {
      newAbsPos.y = -offsetY;
    }
    if (box.x - workingArea.x + box.width > workingArea.width) {
      newAbsPos.x = workingArea.width - box.width - offsetX;
    }
    if (box.y - workingArea.y + box.height > workingArea.height) {
      newAbsPos.y = workingArea.height - box.height - offsetY;
    }
    shape.setAbsolutePosition(newAbsPos);
  });
};

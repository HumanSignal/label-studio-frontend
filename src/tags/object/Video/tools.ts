import { useCallback, useEffect, useRef, useState } from "react";
import { KonvaNode, WorkingArea } from "./types";

export const useShapeBounds = (
  position: { x: number, y: number },
  workingArea: WorkingArea,
  allowRegionsOutsideWorkingArea = true,
) => {
  const shape = useRef<KonvaNode>();
  const [bounds, setBounds] = useState([0, 0, 0, 0]);

  const updateBounds = useCallback((node: KonvaNode) => {
    const rect = node.getClientRect({
      skipStroke: true,
      skipShadow: true,
    });
    const pos = node.getAbsolutePosition();

    const [xDiff, yDiff] = [pos.x - rect.x, pos.y - rect.y];

    // Get the bounds of the shape in the working area
    /** Left max offset */
    const x0 = position.x + xDiff;
    /** Top max offset */
    const y0 = position.y + yDiff;
    /** Right max offset */
    const x1 = (position.x + workingArea.width) - (rect.width - xDiff);
    /** Bottom max offset */
    const y1 = (position.y + workingArea.height) - (rect.height - yDiff);

    // Get rotation bounds


    setBounds([x0, y0, x1, y1]);
  }, [position, workingArea]);

  const getBoundsPosition = useCallback((pos: { x: number, y: number }) => {
    const [x0, y0, x1, y1] = bounds;

    if (pos.x < x0) pos.x = x0;
    else if (pos.x > x1) pos.x = x1;

    if (pos.y < y0) pos.y = y0;
    else if (pos.y > y1) pos.y = y1;

    return pos;
  }, [bounds, shape]);

  const limitTransformations = useCallback((node: KonvaNode) => {
    const pos = { x: node.x(), y: node.y() };
    const position = allowRegionsOutsideWorkingArea ? pos : getBoundsPosition(pos);

    // const maxShapeWidth =

    node.x(position.x);
    node.y(position.y);
  }, [getBoundsPosition]);

  useEffect(() => {
    if (shape.current) {
      updateBounds(shape.current);
    }
  }, [position, workingArea]);

  return {
    shape,
    bounds,
    updateBounds,
    getBoundsPosition,
    limitTransformations,
    setShape(node: KonvaNode | null) {
      if (node) {
        shape.current = node;
      }
      return node;
    },
  };
};

export const getNodeAbsoluteDimensions = (node: KonvaNode, workingArea: WorkingArea) => {
  const { realWidth: width, realHeight: height } = workingArea;

  const result = {
    x: node.x() / width * 100,
    y: node.y() / height * 100,
    width: node.width() / width * 100,
    height: node.height() / height * 100,
    rotation: node.rotation(),
  };

  console.log(result);

  return result;
};

export const normalizeNodeDimentions = <T extends KonvaNode>(node: T, shapeType: "rect") => {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  switch (shapeType) {
    case "rect": {
      node.width(Math.max(3, node.width() * scaleX));
      node.height(Math.max(3, node.height() * scaleY));
      break;
    }
  }

  node.scaleX(1);
  node.scaleY(1);
};

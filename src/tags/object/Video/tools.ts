import { useCallback, useEffect, useRef, useState } from "react";
import { KonvaNode, WorkingArea } from "./types";

export const getNodeAbsoluteDimensions = (node: KonvaNode, workingArea: WorkingArea) => {
  const { realWidth: width, realHeight: height } = workingArea;

  const result = {
    x: node.x() / width * 100,
    y: node.y() / height * 100,
    width: node.width() / width * 100,
    height: node.height() / height * 100,
    rotation: node.rotation(),
  };

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

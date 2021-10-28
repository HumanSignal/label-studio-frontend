import React from "react";
import { Rect } from "react-konva";
import { observer } from "mobx-react";
import { useRegionStyles } from "../../../hooks/useRegionColor";

const getNodeAbsoluteDimensions = (node, workingArea) => {
  const { realWidth: width, realHeight: height } = workingArea;

  return {
    x: node.x() / width * 100,
    y: node.y() / height * 100,
    width: node.width() / width * 100,
    height: node.height() / height * 100,
  };
};

const BBoxPure = ({ reg, frame, workingArea, ...rest }) => {
  const box = reg.getBBox(frame);
  const style = useRegionStyles(reg, { includeFill: true });

  console.log({ frame, box, seq: reg.sequence });

  if (!box) return null;

  const { realWidth: waWidth, realHeight: waHeight } = workingArea;

  const newBox = {
    x: box.x * waWidth / 100,
    y: box.y * waHeight / 100,
    width: box.width * waWidth / 100,
    height: box.height * waHeight / 100,
  };

  return reg.isInLifespan(frame) ? (
    <Rect
      {...newBox}
      draggable
      fill={style.fillColor}
      stroke={style.strokeColor}
      strokeScaleEnabled={false}
      opacity={reg.hidden ? 0 : 1}
      onTransformEnd={e => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        // set minimal value
        const w = Math.max(3, node.width() * scaleX);
        const h = Math.max(3, node.height() * scaleY);

        node.scaleX(1);
        node.scaleY(1);
        node.setWidth(w);
        node.setHeight(h);

        reg.updateBBox(getNodeAbsoluteDimensions(node, workingArea), frame);
      }}
      onDragEnd={e => {
        const node = e.target;

        reg.updateBBox(getNodeAbsoluteDimensions(node, workingArea), frame);
      }}
      {...rest}
    />
  ) : null;
};

export const BBox = observer(BBoxPure);

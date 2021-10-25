import React from "react";
import { Rect } from "react-konva";
import { observer } from "mobx-react";

const BBoxPure = ({ reg, frame, stageWidth, stageHeight, ...rest }) => {
  const box = reg.getBBox(frame);

  if (!box) return null;

  const newBox = {
    x: box.x * stageWidth / 100,
    y: box.y * stageHeight / 100,
    width: box.width * stageWidth / 100,
    height: box.height * stageHeight / 100,
  };

  // console.log("DRAW BOX", box, newBox, stageWidth, stageHeight);
  console.log({ frame });

  return reg.isInLifespan(frame) ? (
    <Rect
      {...newBox}
      draggable
      fill="rgba(64,0,255,0.3)"
      stroke="blue"
      strokeScaleEnabled={false}
      onTransformEnd={e => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        // set minimal value
        const w = Math.max(3, node.width() * scaleX);
        const h = node.height() * scaleY;

        reg.updateBBox({
          x: node.x() / stageWidth * 100,
          y: node.y() / stageHeight * 100,
          width: w / stageWidth * 100,
          height: h / stageHeight * 100,
        }, frame);

        node.scaleX(1);
        node.scaleY(1);
        node.setWidth(w);
        node.setHeight(h);
      }}
      onDragEnd={e => {
        const node = e.target;

        reg.updateBBox({
          x: node.x() / stageWidth * 100,
          y: node.y() / stageHeight * 100,
          width: node.width() / stageWidth * 100,
          height: node.height() / stageHeight * 100,
        }, frame);
      }}
      {...rest}
    />
  ) : null;
};

export const BBox = observer(BBoxPure);

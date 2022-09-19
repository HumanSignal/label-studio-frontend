import React from "react";
import { Rect } from "react-konva";
import { observer } from "mobx-react";
import { useRegionStyles } from "../../../hooks/useRegionColor";
import { clamp } from "../../../utils/utilities";

/**
 *
 * @param {import("konva/lib/Shape").Shape<import("konva/lib/Shape").ShapeConfig> | import("konva/lib/Stage").Stage} node
 * @param {{realWidth: number, realHeight: number}} workingArea
 * @returns
 */
const getNodeAbsoluteDimensions = (node, workingArea) => {
  const { realWidth: width, realHeight: height } = workingArea;

  return {
    x: node.x() / width * 100,
    y: node.y() / height * 100,
    width: node.width() / width * 100,
    height: node.height() / height * 100,
    rotation: node.rotation(),
  };
};

const RectanglePure = ({ reg, frame, workingArea, ...rest }) => {
  const box = reg.getShape(frame);
  const style = useRegionStyles(reg, { includeFill: true });

  if (!box) return null;

  const { realWidth: waWidth, realHeight: waHeight } = workingArea;

  console.log(workingArea);

  const newBox = {
    x: box.x * waWidth / 100,
    y: box.y * waHeight / 100,
    width: box.width * waWidth / 100,
    height: box.height * waHeight / 100,
    rotation: box.rotation,
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

        reg.updateShape(getNodeAbsoluteDimensions(node, workingArea), frame);
      }}
      dragBoundFunc={function(pos) {
        const { realWidth, realHeight, width, height } = workingArea;

        const nodeWidth = this.width();
        const nodeHeight = this.height();
        const newX = clamp(pos.x, realWidth - width, realWidth - nodeWidth);
        const newY = clamp(pos.y, realHeight - height, realHeight - nodeHeight);

        return { x: newX, y: newY };
      }}

      onDragMove={e => {
        const node = e.target;

        getNodeAbsoluteDimensions(node, workingArea);
      }}
      onTransform={e => {
        const node = e.target;

        getNodeAbsoluteDimensions(node, workingArea);
      }}
      onDragEnd={e => {
        const node = e.target;

        reg.updateShape(getNodeAbsoluteDimensions(node, workingArea), frame);
      }}
      {...rest}
    />
  ) : null;
};

export const Rectangle = observer(RectanglePure);

import React, { useMemo } from "react";
import { Group, Rect } from "react-konva";
import { observer } from "mobx-react";
import { useRegionStyles } from "../../../hooks/useRegionColor";
import { LabelOnVideoBbox } from "../../../components/ImageView/LabelOnRegion";

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

  const { realWidth: waWidth, realHeight: waHeight, scale: waScale } = workingArea;

  const newBox = useMemo(()=>({
    x: box.x * waWidth / 100,
    y: box.y * waHeight / 100,
    width: box.width * waWidth / 100,
    height: box.height * waHeight / 100,
    rotation: box.rotation,
  }), [box, waWidth, waHeight]);

  return reg.isInLifespan(frame) ? (
    <Group>
      <LabelOnVideoBbox
        reg={reg}
        box={newBox}
        scale={waScale}
        color={style.strokeColor}
        strokeWidth={style.strokeWidth}
        adjacent
      />
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
        onDragEnd={e => {
          const node = e.target;

          reg.updateShape(getNodeAbsoluteDimensions(node, workingArea), frame);
        }}
        {...rest}
      />
    </Group>
  ) : null;
};

export const Rectangle = observer(RectanglePure);

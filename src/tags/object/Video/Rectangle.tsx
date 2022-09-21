import { KonvaEventObject } from "konva/lib/Node";
import { observer } from "mobx-react";
import { FC, useEffect, useMemo, useState } from "react";
import { Rect } from "react-konva";
import { useRegionStyles } from "../../../hooks/useRegionColor";
import { WorkingArea } from "./types";
import { getNodeAbsoluteDimensions, normalizeNodeDimentions, useShapeBounds } from "./tools";

type RectPropsExtend = typeof Rect;

interface RectProps extends RectPropsExtend {
  reg: any;
  frame: number;
  selected: boolean;
  draggable: boolean;
  listening: boolean;
  box: { x: number, y: number, width: number, height: number, rotation: number };
  workingArea: WorkingArea;
  position: { x: number, y: number };
  allowRegionsOutsideWorkingArea: boolean;
}

const RectanglePure: FC<RectProps> = ({
  reg,
  box,
  frame,
  workingArea,
  position,
  selected,
  draggable,
  listening,
  allowRegionsOutsideWorkingArea,
  ...rest
}) => {
  const style = useRegionStyles(reg, { includeFill: true });
  const { setShape, updateBounds, getBoundsPosition, limitTransformations } = useShapeBounds(
    position,
    workingArea,
    allowRegionsOutsideWorkingArea,
  );

  const { realWidth: waWidth, realHeight: waHeight } = workingArea;

  const newBox = {
    x: box.x * waWidth / 100,
    y: box.y * waHeight / 100,
    width: box.width * waWidth / 100,
    height: box.height * waHeight / 100,
    rotation: box.rotation,
  };

  const onDimensionUpdate = (e: KonvaEventObject<Event>) => {
    const node = e.target;

    reg.updateShape(getNodeAbsoluteDimensions(node, workingArea), frame);
    updateBounds(node);
  };

  const onTransform = (e: KonvaEventObject<Event>) => {
    const node = e.target;
    // limitTransformations(e.target);

    normalizeNodeDimentions(node, "rect");
  };

  const dragBoundFunc = (pos: { x: number, y: number }) => {
    return allowRegionsOutsideWorkingArea ? pos : getBoundsPosition(pos);
  };

  return (
    <Rect
      {...newBox}
      ref={setShape}
      fill={style.fillColor ?? "#fff"}
      stroke={style.strokeColor}
      strokeScaleEnabled={false}
      selected={selected}
      draggable={draggable}
      listening={listening}
      opacity={reg.hidden ? 0 : 1}
      onTransform={onTransform}
      onTransformEnd={onDimensionUpdate}
      onDragMove={onDimensionUpdate}
      onDragEnd={onDimensionUpdate}
      dragBoundFunc={dragBoundFunc}
      {...rest}
    />
  );
};

export const Rectangle = observer(RectanglePure);

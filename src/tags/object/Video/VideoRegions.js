import React, { useEffect, useRef, useState } from "react";
import { Layer, Rect, Stage, Transformer } from "react-konva";
import { inject, observer } from "mobx-react";
import { BBox } from "./BBox";

const MIN_SIZE = 5;

const VideoRegionsPure = ({ item, width, height }) => {
  const [newRegion, setNewRegion] = useState();
  const [isDrawing, setDrawingMode] = useState(false);
  const [selected, setSelected] = useState();
  const stageRef = useRef();

  useEffect(() => {
    if (!isDrawing && newRegion) {
      const fixedRegion = {
        x: newRegion.x / width * 100,
        y: newRegion.y / height * 100,
        width: newRegion.width / width * 100,
        height: newRegion.height / height * 100,
      };

      item.addRegion(fixedRegion);
      setNewRegion(null);
    }
  }, [isDrawing]);

  const handleMouseDown = e => {
    if (stageRef.current?.pointertargetShape) return;

    const { offsetX: x, offsetY: y } = e.evt;

    setNewRegion({ x, y, width: 0, height: 0 });
    setDrawingMode(true);
  };

  const handleMouseMove = e => {
    if (!isDrawing) return false;

    const { offsetX: x, offsetY: y } = e.evt;

    setNewRegion(region => ({ ...region, width: x - region.x, height: y - region.y }));
  };

  const handleMouseUp = e => {
    if (!isDrawing) return false;

    const { offsetX: x, offsetY: y } = e.evt;

    if (Math.abs(newRegion.x - x) < MIN_SIZE && Math.abs(newRegion.y - y) < MIN_SIZE) {
      setNewRegion(null);
      setSelected(null);
    } else {
      setNewRegion(region => ({ ...region, width: x - region.x, height: y - region.y }));
    }
    setDrawingMode(false);
  };

  const initTransform = tr => {
    if (!tr) return;

    const stage = tr.getStage();
    const shapes = selected.map(shape => stage.findOne("#" + shape.id)).filter(Boolean);

    tr.nodes(shapes);
    tr.getLayer().batchDraw();
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{ position: "absolute", zIndex: 1 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {item.regs.map(reg => (
          <BBox
            id={reg.id}
            key={reg.id}
            reg={reg}
            frame={item.frame}
            stageWidth={width}
            stageHeight={height}
            draggable={!isDrawing}
            onClick={() => setSelected(selected?.[0] === reg ? null : [reg])}
          />
        ))}
      </Layer>
      {isDrawing && (
        <Layer>
          <Rect {...newRegion} fill="red"/>
        </Layer>
      )}
      {selected?.length > 0 && (
        <Layer>
          <Transformer ref={initTransform} keepRatio={false} ignoreStroke/>
        </Layer>
      )}
    </Stage>
  );
};

export const VideoRegions = inject("store")(observer(VideoRegionsPure));

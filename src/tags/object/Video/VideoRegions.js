import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Transformer } from "react-konva";
import { inject, observer } from "mobx-react";
import { BBox } from "./BBox";
import Constants from "../../../core/Constants";

const MIN_SIZE = 5;

const VideoRegionsPure = ({
  store,
  item,
  regions,
  width,
  height,
  zoom,
  workingArea,
  pan = { x: 0, y: 0 },
}) => {
  const [newRegion, setNewRegion] = useState();
  const [isDrawing, setDrawingMode] = useState(false);
  const stageRef = useRef();

  const selected = regions.filter((reg) => reg.selected && !reg.hidden);

  const workinAreaCoordinates = useMemo(() => {
    const resultWidth = workingArea.width * zoom;
    const resultHeight = workingArea.height * zoom;

    const offsetLeft = ((width - resultWidth) / 2) + pan.x;
    const offsetTop = ((height - resultHeight) / 2) + pan.y;

    return {
      width: resultWidth,
      height: resultHeight,
      x: offsetLeft,
      y: offsetTop,
      scale: zoom,
      realWidth: workingArea.width,
      realHeight: workingArea.height,
    };
  }, [pan, zoom, workingArea, width, height]);

  const layerProps = useMemo(() => ({
    width: workinAreaCoordinates.width,
    height: workinAreaCoordinates.height,
    scaleX: zoom,
    scaleY: zoom,
    position: {
      x: workinAreaCoordinates.x,
      y: workinAreaCoordinates.y,
    },
  }), [workinAreaCoordinates, zoom]);

  const normalizeMouseOffsets = useCallback((x, y) => {
    const { x: offsetLeft, y: offsetTop } = workinAreaCoordinates;

    return {
      x: (x - offsetLeft) / zoom,
      y: (y - offsetTop) / zoom,
    };
  }, [workinAreaCoordinates, zoom]);

  useEffect(() => {
    if (!isDrawing && newRegion) {
      const { width, height } = workingArea;

      const fixedRegion = {
        x: (newRegion.x / width) * 100,
        y: (newRegion.y / height) * 100,
        width: (newRegion.width / width) * 100,
        height: (newRegion.height / height) * 100,
      };

      item.addRegion(fixedRegion);
      setNewRegion(null);
    }
  }, [isDrawing, workinAreaCoordinates, workingArea]);

  const handleMouseDown = e => {
    if (stageRef.current?.pointertargetShape) return;

    const { x, y } = normalizeMouseOffsets(e.evt.offsetX, e.evt.offsetY);
    // const { offsetX: x, offsetY: y } = e.evt;

    item.annotation.unselectAreas();
    setNewRegion({ x, y, width: 0, height: 0 });
    setDrawingMode(true);
  };

  const handleMouseMove = e => {
    if (!isDrawing) return false;

    const { x, y } = normalizeMouseOffsets(e.evt.offsetX, e.evt.offsetY);
    // const { offsetX: x, offsetY: y } = e.evt;

    setNewRegion(region => ({
      ...region,
      width: x - region.x,
      height: y - region.y,
    }));
  };

  const handleMouseUp = e => {
    if (!isDrawing) return false;

    const { x, y } = normalizeMouseOffsets(e.evt.offsetX, e.evt.offsetY);
    // const { offsetX: x, offsetY: y } = e.evt;

    if (Math.abs(newRegion.x - x) < MIN_SIZE && Math.abs(newRegion.y - y) < MIN_SIZE) {
      setNewRegion(null);
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
      <Layer {...layerProps}>
        {regions.map(reg => (
          <BBox
            id={reg.id}
            key={reg.id}
            reg={reg}
            frame={item.frame}
            workingArea={workinAreaCoordinates}
            draggable={!isDrawing}
            selected={reg.selected}
            onClick={(e) => {
              // if (!reg.annotation.editable || reg.parent.getSkipInteractions()) return;
              if (store.annotationStore.selected.relationMode) {
                stageRef.current.container().style.cursor = Constants.DEFAULT_CURSOR;
              }

              reg.setHighlight(false);
              reg.onClickRegion(e);
            }}
          />
        ))}
      </Layer>
      {isDrawing && (
        <Layer {...layerProps}>
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Transformer } from "react-konva";
import { inject, observer } from "mobx-react";
import { Rectangle } from "./Rectangle";
import Constants from "../../../core/Constants";
import chroma from "chroma-js";

const MIN_SIZE = 5;

const SelectionRect = (props) => {
  return (
    <>
      <Rect
        {...props}
        strokeWidth={2}
        stroke="#fff"
      />
      <Rect
        {...props}
        fill={chroma("#0099FF").alpha(0.1).css()}
        strokeWidth={2}
        stroke="#0099FF"
        dash={[2, 2]}
      />
    </>
  );
};

const VideoRegionsPure = ({
  store,
  item,
  regions,
  width,
  height,
  zoom,
  workingArea: videoDimensions,
  locked = false,
  pan = { x: 0, y: 0 },
}) => {
  const [newRegion, setNewRegion] = useState();
  const [isDrawing, setDrawingMode] = useState(false);
  const stageRef = useRef();

  const selected = regions.filter((reg) => (reg.selected || reg.inSelection) && !reg.hidden && !reg.locked && !reg.readonly);
  const listenToEvents = !locked && item.annotation.editable;

  const workinAreaCoordinates = useMemo(() => {
    const resultWidth = videoDimensions.width * zoom;
    const resultHeight = videoDimensions.height * zoom;

    const offsetLeft = ((width - resultWidth) / 2) + pan.x;
    const offsetTop = ((height - resultHeight) / 2) + pan.y;

    return {
      width: resultWidth,
      height: resultHeight,
      x: offsetLeft,
      y: offsetTop,
      scale: zoom,
      realWidth: videoDimensions.width,
      realHeight: videoDimensions.height,
    };
  }, [pan.x, pan.y, zoom, videoDimensions, width, height]);

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
      const { width: waWidth, height: waHeight } = videoDimensions;
      let x = (newRegion.x / waWidth) * 100;
      let y = (newRegion.y / waHeight) * 100;
      let width = (newRegion.width / waWidth) * 100;
      let height = (newRegion.height / waHeight) * 100;

      // deal with negative sizes
      if (width < 0) {
        width *= -1;
        x -= width;
      }
      if (height < 0) {
        height *= -1;
        y -= height;
      }

      const fixedRegion = { x, y, width, height };

      item.addRegion(fixedRegion);
      setNewRegion(null);
    }
  }, [isDrawing, workinAreaCoordinates, videoDimensions]);

  const handleMouseDown = e => {
    if (e.target !== stageRef.current) return;

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

  const eventHandlers = listenToEvents ? {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  } : {};


  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{ position: "absolute", zIndex: 1 }}
      listening={listenToEvents}
      {...eventHandlers}
    >
      <Layer {...layerProps}>
        {regions.map(reg => (
          <Rectangle
            id={reg.id}
            key={reg.id}
            reg={reg}
            frame={item.frame}
            workingArea={workinAreaCoordinates}
            draggable={!isDrawing && !locked}
            selected={reg.selected || reg.inSelection}
            listening={(!reg.locked && !reg.readonly)}
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
          <SelectionRect {...newRegion}/>
        </Layer>
      )}
      {selected?.length > 0 && (
        <Layer>
          <Transformer ref={initTransform} keepRatio={false} ignoreStroke flipEnabled={false} />
        </Layer>
      )}
    </Stage>
  );
};

export const VideoRegions = inject("store")(observer(VideoRegionsPure));

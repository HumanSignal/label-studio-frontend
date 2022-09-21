import chroma from "chroma-js";
import { clamp } from "lodash";
import { observer } from "mobx-react";
import { getParentOfType } from "mobx-state-tree";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Transformer } from "react-konva";
import Constants from "../../../core/Constants";
import { Annotation } from "../../../stores/Annotation/Annotation";
import { Rectangle } from "./Rectangle";
import { createBoundingBoxGetter, createOnDragMoveHandler } from "./TransformTools";

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
  item,
  regions,
  width,
  height,
  zoom,
  workingArea: videoDimensions,
  locked = false,
  allowRegionsOutsideWorkingArea = true,
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

  const inBounds = (x, y) => {
    if (allowRegionsOutsideWorkingArea) return true;
    if (x < 0 || x > workinAreaCoordinates.realWidth) return false;
    if (y < 0 || y > workinAreaCoordinates.realHeight) return false;
    return true;
  };

  const limitCoordinates = ({ x, y }) => {
    if (allowRegionsOutsideWorkingArea) return { x, y };
    return {
      x: clamp(x, 0, workinAreaCoordinates.realWidth),
      y: clamp(y, 0, workinAreaCoordinates.realHeight),
    };
  };

  const handleMouseDown = e => {
    if (e.target !== stageRef.current) return;

    const { x, y } = limitCoordinates(normalizeMouseOffsets(e.evt.offsetX, e.evt.offsetY));

    if (inBounds(x, y)) {
      item.annotation.unselectAreas();
      setNewRegion({ x, y, width: 0, height: 0 });
      setDrawingMode(true);
    }
  };

  const handleMouseMove = e => {
    if (!isDrawing) return false;

    const { x, y } = limitCoordinates(normalizeMouseOffsets(e.evt.offsetX, e.evt.offsetY));

    setNewRegion(region => ({
      ...region,
      width: x - region.x,
      height: y - region.y,
    }));
  };

  const handleMouseUp = e => {
    if (!isDrawing) return false;

    const { x, y } = limitCoordinates(normalizeMouseOffsets(e.evt.offsetX, e.evt.offsetY));

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
        <RegionsLayer
          regions={regions}
          item={item}
          layerProps={layerProps}
          locked={locked}
          isDrawing={isDrawing}
          workinAreaCoordinates={workinAreaCoordinates}
          onDragMove={createOnDragMoveHandler(workinAreaCoordinates, !allowRegionsOutsideWorkingArea)}
          stageRef={stageRef}
        />
      </Layer>
      {isDrawing && (
        <Layer {...layerProps}>
          <SelectionRect {...newRegion}/>
        </Layer>
      )}
      {selected?.length > 0 && (
        <Layer>
          <Transformer
            ref={initTransform}
            keepRatio={false}
            ignoreStroke
            flipEnabled={false}
            boundBoxFunc={createBoundingBoxGetter(workinAreaCoordinates, !allowRegionsOutsideWorkingArea)}
            onDragMove={createOnDragMoveHandler(workinAreaCoordinates, !allowRegionsOutsideWorkingArea)}
          />
        </Layer>
      )}
    </Stage>
  );
};

const RegionsLayer = observer(({
  regions,
  item,
  locked,
  isDrawing,
  workinAreaCoordinates,
  stageRef,
  onDragMove,
}) => {
  return (
    <>
      {regions.map(reg => (
        <Shape
          id={reg.id}
          key={reg.id}
          reg={reg}
          frame={item.frame}
          workingArea={workinAreaCoordinates}
          draggable={!isDrawing && !locked}
          selected={reg.selected || reg.inSelection}
          listening={!reg.locked && !reg.readonly}
          stageRef={stageRef}
          onDragMove={onDragMove}
        />
      ))}
    </>
  );
});

const Shape = observer(({
  reg,
  frame,
  stageRef,
  ...props
}) => {
  const box = reg.getShape(frame);

  return reg.isInLifespan(frame) && box && (
    <Rectangle
      reg={reg}
      box={box}
      frame={frame}
      onClick={(e) => {
        const annotation = getParentOfType(reg, Annotation);

        if (annotation && annotation.relationMode) {
          stageRef.current.container().style.cursor = Constants.DEFAULT_CURSOR;
        }

        reg.setHighlight(false);
        reg.onClickRegion(e);
      }}
      {...props}
    />
  );
});

export const VideoRegions = observer(VideoRegionsPure);

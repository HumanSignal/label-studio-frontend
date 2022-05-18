import React, { Component, createRef, forwardRef, Fragment, memo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage } from "react-konva";
import { observer } from "mobx-react";
import { getRoot, isAlive } from "mobx-state-tree";

import ImageGrid from "../ImageGrid/ImageGrid";
import ImageTransformer from "../ImageTransformer/ImageTransformer";
import ObjectTag from "../../components/Tags/Object";
import Tree from "../../core/Tree";
import styles from "./ImageView.module.scss";
import { errorBuilder } from "../../core/DataValidator/ConfigValidator";
import messages from "../../utils/messages";
import { chunks, findClosestParent } from "../../utils/utilities";
import Konva from "konva";
import { LoadingOutlined } from "@ant-design/icons";
import { Toolbar } from "../Toolbar/Toolbar";
import { ImageViewProvider } from "./ImageViewContext";
import { Hotkey } from "../../core/Hotkey";
import { useObserver } from "mobx-react";
import ResizeObserver from "../../utils/resize-observer";
import { debounce } from "../../utils/debounce";
import Constants from "../../core/Constants";
import { fixRectToFit } from "../../utils/image";
import { FF_DEV_1285, isFF } from "../../utils/feature-flags";

Konva.showWarnings = false;

const hotkeys = Hotkey("Image");

const splitRegions = (regions) => {
  const brushRegions = [];
  const shapeRegions = [];
  const l = regions.length;
  let i = 0;

  for (i; i < l; i++) {
    const region = regions[i];

    if (region.type === "brushregion") {
      brushRegions.push(region);
    } else {
      shapeRegions.push(region);
    }
  }

  return {
    brushRegions,
    shapeRegions,
  };
};

const Region = memo(({ region, showSelected = false }) => {
  return useObserver(() => (region.inSelection !== showSelected ? null : Tree.renderItem(region, false)));
});

const RegionsLayer = memo(({ regions, name, useLayers, showSelected = false }) => {
  const content = regions.map((el) => (
    <Region key={`region-${el.id}`} region={el} showSelected={showSelected} />
  ));

  return useLayers === false ? (
    content
  ) : (
    <Layer name={name}>
      {content}
    </Layer>
  );
});

const Regions = memo(({ regions, useLayers = true, chunkSize = 15, suggestion = false, showSelected = false }) => {
  return (
    <ImageViewProvider value={{ suggestion }}>
      {(chunkSize ? chunks(regions, chunkSize) : regions).map((chunk, i) => (
        <RegionsLayer
          key={`chunk-${i}`}
          name={`chunk-${i}`}
          regions={chunk}
          useLayers={useLayers}
          showSelected={showSelected}
        />
      ))}
    </ImageViewProvider>
  );
});

const DrawingRegion = observer(({ item }) => {
  const { drawingRegion } = item;
  const Wrapper = drawingRegion && drawingRegion.type === "brushregion" ? Fragment : Layer;

  return (
    <Wrapper>
      {drawingRegion ? <Region key={`drawing`} region={drawingRegion} /> : drawingRegion}
    </Wrapper>
  );
});

const SELECTION_COLOR = "#40A9FF";
const SELECTION_SECOND_COLOR = "white";
const SELECTION_DASH = [3, 3];

const SelectionBorders = observer(({ item, selectionArea }) => {
  const { selectionBorders: bbox } = selectionArea;
  const offset = {
    x: item.zoomingPositionX || 0,
    y: item.zoomingPositionY || 0,
  };

  bbox.left = bbox.left * item.stageScale;
  bbox.right = bbox.right * item.stageScale;
  bbox.top = bbox.top * item.stageScale ;
  bbox.bottom = bbox.bottom * item.stageScale ;

  const points = bbox ? [
    {
      x: bbox.left,
      y: bbox.top,
    },
    {
      x: bbox.right,
      y: bbox.top,
    },
    {
      x: bbox.left,
      y: bbox.bottom,
    },
    {
      x: bbox.right,
      y: bbox.bottom,
    },
  ] : [];

  return (
    <>
      {bbox && (
        <Rect
          name="regions_selection"
          x={bbox.left}
          y={bbox.top}
          width={bbox.right - bbox.left}
          height={bbox.bottom - bbox.top}
          stroke={SELECTION_COLOR}
          strokeWidth={1}
          listening={false}
        />
      )}
      {points.map((point, idx) => {
        return (
          <Rect
            key={idx}
            x={point.x - 3}
            y={point.y - 3}
            width={6}
            height={6}
            fill={SELECTION_COLOR}
            stroke={SELECTION_SECOND_COLOR}
            strokeWidth={2}
            listening={false}
          />
        );
      })}
    </>
  );
});

const SelectionRect = observer(({ item }) => {
  const { x, y, width, height } = item;

  const positionProps = {
    x,
    y,
    width,
    height,
    listening: false,
    strokeWidth: 1,
  };

  return (
    <>
      <Rect
        {...positionProps}
        stroke={SELECTION_COLOR}
        dash={SELECTION_DASH}
      />
      <Rect
        {...positionProps}
        stroke={SELECTION_SECOND_COLOR}
        dash={SELECTION_DASH}
        dashOffset={SELECTION_DASH[0]}
      />
    </>
  );
});

const TRANSFORMER_BACK_ID = "transformer_back";

const TransformerBack = observer(({ item }) => {
  const { selectedRegionsBBox } = item;
  const singleNodeMode = item.selectedRegions.length === 1;
  const dragStartPointRef = useRef({ x: 0, y: 0 });

  return (
    <Layer>
      {selectedRegionsBBox && !singleNodeMode && (
        <Rect
          id={TRANSFORMER_BACK_ID}
          fill="rgba(0,0,0,0)"
          draggable
          onClick={()=>{
            item.annotation.unselectAreas();
          }}
          onMouseOver={(ev) => {
            if (!item.annotation.relationMode) {
              ev.target.getStage().container().style.cursor = Constants.POINTER_CURSOR;
            }
          }}
          onMouseOut={(ev) => {
            ev.target.getStage().container().style.cursor = Constants.DEFAULT_CURSOR;
          }}
          onDragStart={e=>{
            dragStartPointRef.current = {
              x: e.target.getAttr("x"),
              y: e.target.getAttr("y"),
            };
          }}
          dragBoundFunc={(pos) => {
            let { x, y } = pos;
            const { top, left, right, bottom } =  item.selectedRegionsBBox;
            const { stageHeight, stageWidth } = item;

            const offset = {
              x: dragStartPointRef.current.x-left,
              y: dragStartPointRef.current.y-top,
            };

            x -=offset.x;
            y -=offset.y;

            const bbox = { x, y, width: right - left, height: bottom  - top };

            const fixed = fixRectToFit(bbox, stageWidth, stageHeight);

            if (fixed.width !== bbox.width) {
              x += (fixed.width - bbox.width) * (fixed.x !== bbox.x ? -1 : 1);
            }

            if (fixed.height !== bbox.height) {
              y += (fixed.height - bbox.height) * (fixed.y !== bbox.y ? -1 : 1);
            }

            x +=offset.x;
            y +=offset.y;
            return { x, y };
          }}
        />
      )}
    </Layer>
  );
});

const SelectedRegions = observer(({ item, selectedRegions }) => {
  if (!selectedRegions) return null;
  const { brushRegions = [], shapeRegions = [] } = splitRegions(selectedRegions);

  return (
    <>
      <TransformerBack item={item}/>
      {brushRegions.length > 0 && (
        <Regions
          key="brushes"
          name="brushes"
          regions={brushRegions}
          useLayers={false}
          showSelected
          chankSize={0}
        />
      )}

      {shapeRegions.length > 0 && (
        <Regions
          key="shapes"
          name="shapes"
          regions={shapeRegions}
          showSelected
          chankSize={0}
        />
      )}
    </>
  );
});

const SelectionLayer = observer(({ item, selectionArea }) => {
  const scale = 1 / (item.zoomScale || 1);

  let supportsTransform = true;
  let supportsRotate = true;
  let supportsScale = true;

  item.selectedRegions?.forEach(shape => {
    supportsTransform = supportsTransform && shape.supportsTransform === true;
    supportsRotate = supportsRotate && shape.canRotate === true;
    supportsScale = supportsScale && true;
  });

  supportsTransform = supportsTransform && (item.selectedRegions.length > 1 || (item.useTransformer || item.selectedShape?.preferTransformer) && item.selectedShape?.useTransformer);

  return (
    <Layer scaleX={scale} scaleY={scale}>
      {selectionArea.isActive ? (
        <SelectionRect item={selectionArea} />
      ) : (!supportsTransform && item.selectedRegions.length > 1 ? (
        <SelectionBorders item={item} selectionArea={selectionArea} />
      ) : null)}

      <ImageTransformer
        item={item}
        rotateEnabled={supportsRotate}
        supportsTransform={supportsTransform}
        supportsScale={supportsScale}
        selectedShapes={item.selectedRegions}
        singleNodeMode={item.selectedRegions.length === 1}
        useSingleNodeRotation={item.selectedRegions.length === 1 && supportsRotate}
        draggableBackgroundSelector={`#${TRANSFORMER_BACK_ID}`}
      />
    </Layer>
  );
});

const Selection = observer(({ item, selectionArea }) => {
  return (
    <>
      <SelectedRegions key="selected-regions" item={item} selectedRegions={item.selectedRegions} />
      <SelectionLayer item={item} selectionArea={selectionArea} />
    </>
  );
});

const Crosshair = memo(forwardRef(({ width, height }, ref) => {
  const [pointsV, setPointsV] = useState([50, 0, 50, height]);
  const [pointsH, setPointsH] = useState([0, 100, width, 100]);
  const [x, setX] = useState(100);
  const [y, setY] = useState(50);

  const [visible, setVisible] = useState(false);
  const strokeWidth = 1;
  const dashStyle = [3, 3];
  let enableStrokeScale = true;

  if (isFF(FF_DEV_1285)) {
    enableStrokeScale = false;
  }

  if (ref) {
    ref.current = {
      updatePointer(newX, newY) {
        if (newX !== x) {
          setX(newX);
          setPointsV([newX, 0, newX, height]);
        }

        if (newY !== y) {
          setY(newY);
          setPointsH([0, newY, width, newY]);
        }
      },
      updateVisibility(visibility) {
        setVisible(visibility);
      },
    };
  }

  return (
    <Layer
      name="crosshair"
      listening={false}
      opacity={visible ? 0.6 : 0}
    >
      <Group>
        <Line
          name="v-white"
          points={pointsH}
          stroke="#fff"
          strokeWidth={strokeWidth}
          strokeScaleEnabled={enableStrokeScale}
        />
        <Line
          name="v-black"
          points={pointsH}
          stroke="#000"
          strokeWidth={strokeWidth}
          dash={dashStyle}
          strokeScaleEnabled={enableStrokeScale}
        />
      </Group>
      <Group>
        <Line
          name="h-white"
          points={pointsV}
          stroke="#fff"
          strokeWidth={strokeWidth}
          strokeScaleEnabled={enableStrokeScale}
        />
        <Line
          name="h-black"
          points={pointsV}
          stroke="#000"
          strokeWidth={strokeWidth}
          dash={dashStyle}
          strokeScaleEnabled={enableStrokeScale}
        />
      </Group>
    </Layer>
  );
}));

export default observer(
  class ImageView extends Component {
    // stored position of canvas before creating region
    canvasX;
    canvasY;
    lastOffsetWidth = -1;
    lastOffsetHeight = -1;
    state = {
      imgStyle: {},
      pointer: [0, 0],
    };

    imageRef = createRef();
    crosshairRef = createRef();

    handleOnClick = e => {
      const { item } = this.props;

      if (!item.annotation.editable) return;

      const evt = e.evt || e;

      return item.event("click", evt, evt.offsetX, evt.offsetY);
    };

    handleMouseDown = e => {
      const { item } = this.props;

      item.updateSkipInteractions(e);

      // item.freezeHistory();
      const p = e.target.getParent();

      if (!item.annotation.editable) return;
      if (p && p.className === "Transformer") return;

      if (
        // create regions over another regions with Cmd/Ctrl pressed
        item.getSkipInteractions() ||
        e.target === e.target.getStage() ||
        findClosestParent(
          e.target,
          el => el.nodeType === "Group" && ["ruler", "segmentation"].indexOf(el?.attrs?.name) > -1,
        )
      ) {
        window.addEventListener("mousemove", this.handleGlobalMouseMove);
        window.addEventListener("mouseup", this.handleGlobalMouseUp);
        const { offsetX: x, offsetY: y } = e.evt;
        // store the canvas coords for calculations in further events
        const { left, top } = item.containerRef.getBoundingClientRect();

        this.canvasX = left;
        this.canvasY = top;
        return item.event("mousedown", e, x, y);
      }

      return true;
    };

    /**
     * Mouse up outside the canvas
     */
    handleGlobalMouseUp = e => {
      window.removeEventListener("mousemove", this.handleGlobalMouseMove);
      window.removeEventListener("mouseup", this.handleGlobalMouseUp);

      if (e.target && e.target.tagName === "CANVAS") return;

      const { item } = this.props;
      const { clientX: x, clientY: y } = e;

      item.freezeHistory();

      return item.event("mouseup", e, x - this.canvasX, y - this.canvasY);
    };

    handleGlobalMouseMove = e => {
      if (e.target && e.target.tagName === "CANVAS") return;

      const { item } = this.props;
      const { clientX: x, clientY: y } = e;

      return item.event("mousemove", e, x - this.canvasX, y - this.canvasY);
    };

    /**
     * Mouse up on Stage
     */
    handleMouseUp = e => {
      const { item } = this.props;

      item.freezeHistory();
      item.setSkipInteractions(false);

      return item.event("mouseup", e, e.evt.offsetX, e.evt.offsetY);
    };

    handleMouseMove = e => {
      const { item } = this.props;

      item.freezeHistory();

      this.updateCrosshair(e);

      const isMouseWheelClick = e.evt && e.evt.buttons === 4;
      const isShiftDrag = e.evt && e.evt.buttons === 1 && e.evt.shiftKey;

      if ((isMouseWheelClick || isShiftDrag) && item.zoomScale > 1) {
        item.setSkipInteractions(true);
        e.evt.preventDefault();

        const newPos = {
          x: item.zoomingPositionX + e.evt.movementX,
          y: item.zoomingPositionY + e.evt.movementY,
        };

        item.setZoomPosition(newPos.x, newPos.y);
      } else {
        item.event("mousemove", e, e.evt.offsetX, e.evt.offsetY);
      }
    };

    updateCrosshair = (e) => {
      if (this.crosshairRef.current) {
        const { x, y } = e.currentTarget.getPointerPosition();

        if (isFF(FF_DEV_1285)) {
          this.crosshairRef.current.updatePointer(...this.props.item.fixZoomedCoords([x, y]));
        } else {
          this.crosshairRef.current.updatePointer(x, y);
        }
      }
    };

    handleError = () => {
      const { item, store } = this.props;
      const cs = store.annotationStore;
      const message = messages.ERR_LOADING_HTTP({ attr: item.value, error: "", url: item._value });

      cs.addErrors([errorBuilder.generalError(message)]);
    };

    updateGridSize = range => {
      const { item } = this.props;

      item.freezeHistory();

      item.setGridSize(range);
    };

    /**
     * Handle to zoom
     */
    handleZoom = e => {
      /**
       * Disable if user doesn't use ctrl
       */
      if (e.evt && !e.evt.ctrlKey) {
        return;
      } else if (e.evt && e.evt.ctrlKey) {
        /**
         * Disable scrolling page
         */
        e.evt.preventDefault();
      }
      if (e.evt) {
        const { item } = this.props;
        const stage = item.stageRef;

        item.handleZoom(e.evt.deltaY, stage.getPointerPosition());
      }
    };

    renderRulers() {
      const { item } = this.props;
      const width = 1;
      const color = "white";

      return (
        <Group
          name="ruler"
          onClick={ev => {
            ev.cancelBubble = false;
          }}
        >
          <Line
            x={0}
            y={item.cursorPositionY}
            points={[0, 0, item.stageWidth, 0]}
            strokeWidth={width}
            stroke={color}
            tension={0}
            dash={[4, 4]}
            closed
          />
          <Line
            x={item.cursorPositionX}
            y={0}
            points={[0, 0, 0, item.stageHeight]}
            strokeWidth={width}
            stroke={color}
            tension={0}
            dash={[1.5]}
            closed
          />
        </Group>
      );
    }

    onResize = debounce(() => {
      if (!this?.props?.item?.containerRef) return;
      const { offsetWidth, offsetHeight } = this.props.item.containerRef;

      if (this.props.item.naturalWidth <= 1) return;
      if (this.lastOffsetWidth === offsetWidth && this.lastOffsetHeight === offsetHeight) return;

      this.props.item.onResize(offsetWidth, offsetHeight, true);
      this.lastOffsetWidth = offsetWidth;
      this.lastOffsetHeight = offsetHeight;
    }, 16);

    componentDidMount() {
      window.addEventListener("resize", this.onResize);
      this.attachObserver(this.props.item.containerRef);
      this.updateReadyStatus();

      hotkeys.addDescription("shift", "Pan image");
    }

    attachObserver = (node) => {
      if (this.resizeObserver) this.detachObserver();

      if (node) {
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(node);
      }
    };

    detachObserver = () => {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    };

    componentWillUnmount() {
      this.detachObserver();
      window.removeEventListener("resize", this.onResize);

      hotkeys.removeDescription("shift");
    }

    componentDidUpdate() {
      this.onResize();
      this.updateReadyStatus();
    }

    updateReadyStatus() {
      const { item } = this.props;
      const { imageRef } = this;

      if (!item || !isAlive(item) || !imageRef.current) return;
      if (item.isReady !== imageRef.current.complete) item.setReady(imageRef.current.complete);
    }

    renderTools() {
      const { item, store } = this.props;
      const cs = store.annotationStore;

      if (cs.viewingAllAnnotations || cs.viewingAllPredictions) return null;

      const tools = item.getToolsManager().allTools();

      return (
        <Toolbar tools={tools} />
      );
    }

    render() {
      const { item, store } = this.props;

      // @todo stupid but required check for `resetState()`
      // when Image tries to render itself after detouching
      if (!isAlive(item)) return null;

      // TODO fix me
      if (!store.task || !item._value) return null;

      const regions = item.regs;

      const containerStyle = {};

      const containerClassName = styles.container;

      if (getRoot(item).settings.fullscreen === false) {
        containerStyle["maxWidth"] = item.maxwidth;
        containerStyle["maxHeight"] = item.maxheight;
        containerStyle["width"] = item.width;
        containerStyle["height"] = item.height;
      }

      const {
        brushRegions,
        shapeRegions,
      } = splitRegions(regions);

      const {
        brushRegions: suggestedBrushRegions,
        shapeRegions: suggestedShapeRegions,
      } = splitRegions(item.suggestions);

      const renderableRegions = Object.entries({
        brush: brushRegions,
        shape: shapeRegions,
        suggestedBrush: suggestedBrushRegions,
        suggestedShape: suggestedShapeRegions,
      });

      return (
        <ObjectTag
          item={item}
          className={item.images.length > 1 ? styles.withGallery : styles.wrapper}
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            alignSelf: "stretch",
          }}
        >
          <div
            ref={node => {
              item.setContainerRef(node);
              this.attachObserver(node);
            }}
            className={containerClassName}
            style={containerStyle}
          >
            <div
              ref={node => {
                this.filler = node;
              }}
              className={styles.filler}
              style={{ width: "100%", marginTop: item.fillerHeight }}
            />
            <div
              className={styles.frame}
              style={item.canvasSize}
            >
              <img
                ref={ref => {
                  item.setImageRef(ref);
                  this.imageRef.current = ref;
                }}
                style={item.imageTransform}
                src={item._value}
                onLoad={item.updateImageSize}
                onError={this.handleError}
                alt="LS"
              />
            </div>
          </div>
          {/* @todo this is dirty hack; rewrite to proper async waiting for data to load */}
          {item.stageWidth <= 1 ? (item.hasTools ? <div className={styles.loading}><LoadingOutlined /></div> : null) : (
            <Stage
              ref={ref => {
                item.setStageRef(ref);
              }}
              style={{ position: "absolute", top: 0, left: 0 }}
              className={"image-element"}
              width={item.canvasSize.width}
              height={item.canvasSize.height}
              scaleX={item.zoomScale}
              scaleY={item.zoomScale}
              x={item.zoomingPositionX}
              y={item.zoomingPositionY}
              offsetX={item.stageTranslate.x}
              offsetY={item.stageTranslate.y}
              rotation={item.rotation}
              onClick={this.handleOnClick}
              onMouseEnter={() => {
                if (this.crosshairRef.current) {
                  this.crosshairRef.current.updateVisibility(true);
                }
              }}
              onMouseLeave={() => {
                if (this.crosshairRef.current) {
                  this.crosshairRef.current.updateVisibility(false);
                }
              }}
              onDragMove={this.updateCrosshair}
              onMouseDown={this.handleMouseDown}
              onMouseMove={this.handleMouseMove}
              onMouseUp={this.handleMouseUp}
              onWheel={item.zoom ? this.handleZoom : () => {
              }}
            >
              {/* Hack to keep stage in place when there's no regions */}
              {regions.length === 0 && (
                <Layer>
                  <Line points={[0, 0, 0, 1]} stroke="rgba(0,0,0,0)" />
                </Layer>
              )}
              {item.grid && item.sizeUpdated && <ImageGrid item={item} />}

              {renderableRegions.map(([groupName, list]) => {
                const isBrush = groupName.match(/brush/i) !== null;
                const isSuggestion = groupName.match("suggested") !== null;

                return list.length > 0 ? (
                  <Regions
                    key={groupName}
                    name={groupName}
                    regions={list}
                    useLayers={isBrush === false}
                    suggestion={isSuggestion}
                  />
                ) : <Fragment key={groupName} />;
              })}

              <Selection item={item} selectionArea={item.selectionArea} />
              <DrawingRegion item={item} />

              {item.crosshair && (
                <Crosshair
                  ref={this.crosshairRef}
                  width={isFF(FF_DEV_1285) ? item.stageWidth : item.stageComponentSize.width}
                  height={isFF(FF_DEV_1285) ? item.stageHeight : item.stageComponentSize.height}
                />
              )}
            </Stage>
          )}
          {this.renderTools()}
          {item.images.length > 1 && (
            <div className={styles.gallery}>
              {item.images.map((src, i) => (
                <img
                  alt=""
                  key={src}
                  src={src}
                  className={i === item.currentImage && styles.active}
                  height="60"
                  onClick={() => item.setCurrentImage(i)}
                />
              ))}
            </div>
          )}
        </ObjectTag>
      );
    }
  },
);

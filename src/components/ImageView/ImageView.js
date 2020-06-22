import React, { Component } from "react";
import { Stage, Layer, Group, Line, Rect } from "react-konva";
import { observer } from "mobx-react";
import { getRoot } from "mobx-state-tree";

import ImageGrid from "../ImageGrid/ImageGrid";
import ImageTransformer from "../ImageTransformer/ImageTransformer";
import ObjectTag from "../../components/Tags/Object";
import Tree from "../../core/Tree";
import styles from "./ImageView.module.scss";

export default observer(
  class ImageView extends Component {
    interceptorRef = React.createRef();
    // stored position of cursor before draging
    initialX;
    initialY;

    /**
     * Get coords out of Stage; interceptor coords show the shift, relative to initial coords
     */
    getDragCoords = () => {
      const { x, y } = this.interceptorRef.current.attrs;
      return [this.initialX + x, this.initialY + y];
    };

    handleOnClick = e => {
      const { item } = this.props;

      return item.event("click", e, e.evt.offsetX, e.evt.offsetY);
    };

    handleMouseDown = e => {
      const { item } = this.props;

      // item.freezeHistory();
      const p = e.target.getParent();

      if (p && p.className === "Transformer") return;

      if (
        e.target === this.interceptorRef.current ||
        e.target === e.target.getStage() ||
        (e.target.parent && (e.target.parent.attrs.name === "ruler" || e.target.parent.attrs.name === "segmentation"))
      ) {
        const { offsetX: x, offsetY: y } = e.evt;
        // store the initial coords for further events
        this.initialX = x;
        this.initialY = y;
        return item.event("mousedown", e, x, y);
      }

      return true;
    };

    /**
     * Mouse up on Stage; when we click there is only mousedown and no interceptor drag events
     */
    handleMouseUp = e => {
      const { item } = this.props;

      item.freezeHistory();

      return item.event("mouseup", e, e.evt.offsetX, e.evt.offsetY);
    };

    /**
     * Virtual drag ended (maybe out of stage or document), so return the interceptor back
     */
    handleGlobalMouseUp = e => {
      const { item } = this.props;
      const interceptor = this.interceptorRef.current;
      if (interceptor) {
        interceptor.move({ x: -interceptor.attrs.x, y: -interceptor.attrs.y });
        interceptor.getStage().draw();

        item.freezeHistory();

        return item.event("mouseup", e, ...this.getDragCoords());
      }
    };

    handleMouseMove = e => {
      const { item } = this.props;

      item.freezeHistory();

      const stage = item.stageRef;
      const scale = stage.scaleX();

      if (e.evt && (e.evt.buttons === 4 || (e.evt.buttons === 1 && e.evt.shiftKey)) && scale > 1) {
        e.evt.preventDefault();
        const newPos = { x: stage.x() + e.evt.movementX, y: stage.y() + e.evt.movementY };
        item.setZoom(scale, newPos.x, newPos.y);
        stage.position(newPos);
        stage.batchDraw();
      } else {
        return item.event("mousemove", e, ...this.getDragCoords());
      }
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

      const { item } = this.props;
      item.freezeHistory();

      const stage = item.stageRef;
      const scaleBy = parseFloat(item.zoomby);
      const oldScale = stage.scaleX();

      let mousePointTo;
      let newScale;
      let pos;
      let newPos;

      if (e.evt) {
        mousePointTo = {
          x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
          y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        newPos = {
          x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
          y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        };
      } else {
        pos = {
          x: stage.width() / 2,
          y: stage.height() / 2,
        };

        mousePointTo = {
          x: pos.x / oldScale - stage.x() / oldScale,
          y: pos.y / oldScale - stage.y() / oldScale,
        };

        newScale = Math.max(0.05, oldScale * e);

        newPos = {
          x: -(mousePointTo.x - pos.x / newScale) * newScale,
          y: -(mousePointTo.y - pos.y / newScale) * newScale,
        };
      }

      if (item.negativezoom !== true && newScale <= 1) {
        item.setZoom(1, 0, 0);
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
        return;
      }

      stage.scale({ x: newScale, y: newScale });

      item.setZoom(newScale, newPos.x, newPos.y);
      stage.position(newPos);
      stage.batchDraw();
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

    onResize = () => {
      this.props.item.onResize(this.container.offsetWidth, this.container.offsetHeight, true);
    };

    componentDidMount() {
      window.addEventListener("resize", this.onResize);
    }

    componentWillUnmount() {
      window.removeEventListener("resize", this.onResize);
    }

    renderTools() {
      const { item, store } = this.props;
      const cs = store.completionStore;

      if (cs.viewingAllCompletions || cs.viewingAllPredictions) return null;

      return (
        <div className={styles.block}>
          {item
            .getToolsManager()
            .allTools()
            .map(tool => tool.viewClass)}
        </div>
      );
    }

    /**
     * Transparent draggable event interceptor, covered all the canvas.
     * Its goal to capture mouse events outside canvas and even document.
     * This allow us to draw new shapes without lags and control their sizes.
     * During drag mouse coords are captured; after drop interceptor goes back to (0, 0).
     */
    renderInterceptor() {
      const { stageWidth, stageHeight } = this.props.item;

      return (
        <Rect
          x={0}
          y={0}
          width={stageWidth}
          height={stageHeight}
          name="interceptor"
          fill="transparent"
          ref={this.interceptorRef}
          draggable
          onClick={this.handleOnClick}
          onMouseDown={this.handleMouseDown}
          onDragMove={this.handleMouseMove}
          onDragEnd={this.handleGlobalMouseUp}
        />
      );
    }

    render() {
      const { item, store } = this.props;

      // TODO fix me
      if (!store.task || !item._value) return null;

      const cb = item.controlButton();

      const divStyle = {
        overflow: "hidden",
        // width: item.stageWidth + "px",
      };

      const imgStyle = {
        width: item.width,
        transformOrigin: "left top",
        filter: `brightness(${item.brightnessGrade}%) contrast(${item.contrastGrade}%)`,
      };

      if (getRoot(item).settings.imageFullSize === false) {
        imgStyle["maxWidth"] = item.maxwidth;
      }

      if (item.zoomScale !== 1) {
        let { zoomingPositionX, zoomingPositionY } = item;
        const translate = "translate(" + zoomingPositionX + "px," + zoomingPositionY + "px) ";
        imgStyle["transform"] = translate + "scale(" + item.resize + ", " + item.resize + ")";
      }

      return (
        <ObjectTag
          item={item}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div
            ref={node => {
              this.container = node;
            }}
            style={divStyle}
          >
            <img
              ref={ref => {
                item.setImageRef(ref);
              }}
              style={imgStyle}
              src={item._value}
              onLoad={item.updateImageSize}
              onClick={this.handleOnClick}
              alt="LS"
            />
          </div>
          <Stage
            ref={ref => {
              item.setStageRef(ref);
            }}
            style={{ position: "absolute", top: 0, left: 0, brightness: "150%" }}
            className={"image-element"}
            width={item.stageWidth}
            height={item.stageHeight}
            scaleX={item.scale}
            scaleY={item.scale}
            onMouseUp={this.handleMouseUp}
            onWheel={item.zoom ? this.handleZoom : () => {}}
          >
            {item.grid && item.sizeUpdated && <ImageGrid item={item} />}
            {item.regions
              .filter(shape => shape.type === "brushregion")
              .map(shape => (
                <Layer name={"brushLayer-" + shape.id} id={shape.id}>
                  {Tree.renderItem(shape)}
                </Layer>
              ))}
            <Layer>
              {this.renderInterceptor()}

              <Group name="shapes">
                {item.regions.filter(s => s.type !== "brushregion").map(s => Tree.renderItem(s))}
                {item.activeShape && Tree.renderItem(item.activeShape)}

                {item.selectedShape && item.selectedShape.editable && (
                  <ImageTransformer rotateEnabled={cb && cb.canrotate} selectedShape={item.selectedShape} />
                )}
              </Group>
            </Layer>
          </Stage>

          {this.renderTools()}
        </ObjectTag>
      );
    }
  },
);

// <ImageControls
//   item={item}
//   handleZoom={this.handleZoom}
//   updateBrightness={this.updateBrightness}
//   updateGridSize={this.updateGridSize}
//   updateBrushControl={this.updateBrushControl}
//   updateBrushStrokeWidth={this.updateBrushStrokeWidth}
// />

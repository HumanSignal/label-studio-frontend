import React, { Component } from "react";
import { Stage, Layer, Group, Line } from "react-konva";
import { observer } from "mobx-react";
import { getRoot, isAlive } from "mobx-state-tree";

import ImageGrid from "../ImageGrid/ImageGrid";
import ImageTransformer from "../ImageTransformer/ImageTransformer";
import ObjectTag from "../../components/Tags/Object";
import Tree from "../../core/Tree";
import styles from "./ImageView.module.scss";
import { errorBuilder } from "../../core/DataValidator/ConfigValidator";
import { findClosestParent } from "../../utils/utilities";

export default observer(
  class ImageView extends Component {
    // stored position of canvas before creating region
    canvasX;
    canvasY;

    handleOnClick = e => {
      const { item } = this.props;
      let evt = e.evt || e;
      return item.event("click", evt, evt.offsetX, evt.offsetY);
    };

    handleMouseDown = e => {
      const { item } = this.props;
      item.setSkipInteractions(e.evt && (e.evt.metaKey || e.evt.ctrlKey));

      // item.freezeHistory();
      const p = e.target.getParent();

      if (p && p.className === "Transformer") return;

      if (
        // create regions over another regions with Cmd/Ctrl pressed
        (e.evt && (e.evt.metaKey || e.evt.ctrlKey)) ||
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
        const { left, top } = this.container.getBoundingClientRect();
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

      return item.event("mouseup", e, e.evt.offsetX, e.evt.offsetY);
    };

    handleMouseMove = e => {
      const { item } = this.props;

      item.freezeHistory();

      if (e.evt && (e.evt.buttons === 4 || (e.evt.buttons === 1 && e.evt.shiftKey)) && item.zoomScale > 1) {
        e.evt.preventDefault();
        const newPos = { x: item.zoomingPositionX + e.evt.movementX, y: item.zoomingPositionY + e.evt.movementY };
        item.setZoomPosition(newPos.x, newPos.y);
      } else {
        return item.event("mousemove", e, e.evt.offsetX, e.evt.offsetY);
      }
    };

    handleError = () => {
      const { item, store } = this.props;
      const cs = store.annotationStore;

      cs.addErrors([
        errorBuilder.generalError(`Cannot load image (${item._value}).\nCheck console/network panel for more info.`),
      ]);
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

    lastOffsetWidth = -1;
    onResize = () => {
      if (this.container.offsetWidth <= 1) return;
      if (this.lastOffsetWidth === this.container.offsetWidth) return;

      this.props.item.onResize(this.container.offsetWidth, this.container.offsetHeight, true);
      this.lastOffsetWidth = this.container.offsetWidth;
    };

    componentDidMount() {
      window.addEventListener("resize", this.onResize);
    }

    componentWillUnmount() {
      window.removeEventListener("resize", this.onResize);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
      this.onResize();
    }

    renderTools() {
      const { item, store } = this.props;
      const cs = store.annotationStore;

      if (cs.viewingAllAnnotations || cs.viewingAllPredictions) return null;

      return (
        <div className={styles.block}>
          {item
            .getToolsManager()
            .allTools()
            .map(tool => tool.viewClass)}
        </div>
      );
    }

    render() {
      const { item, store } = this.props;

      // @todo stupid but required check for `resetState()`
      // when Image tries to render itself after detouching
      if (!isAlive(item)) return null;

      // TODO fix me
      if (!store.task || !item._value) return null;

      const selected = item.selectedShape;
      const regions = item.regs.filter(r => r !== selected);
      const cb = item.controlButton();
      let filler = null;
      let containerClassName = styles.container;
      const containerStyle = {};

      const imgStyle = {
        width: item.width,
        transformOrigin: "left top",
        filter: `brightness(${item.brightnessGrade}%) contrast(${item.contrastGrade}%)`,
      };
      const imgTransform = [];

      if (getRoot(item).settings.fullscreen === false) {
        containerStyle["maxWidth"] = item.maxwidth;
      }

      if (item.zoomScale !== 1) {
        let { zoomingPositionX, zoomingPositionY } = item;
        imgTransform.push("translate(" + zoomingPositionX + "px," + zoomingPositionY + "px)");
        imgTransform.push("scale(" + item.resize + ", " + item.resize + ")");
      }

      if (item.rotation) {
        const translate = {
          90: `0, -100%`,
          180: `-100%, -100%`,
          270: `-100%, 0`,
        };
        // there is a top left origin already set for zoom; so translate+rotate
        imgTransform.push(`rotate(${item.rotation}deg)`);
        imgTransform.push(`translate(${translate[item.rotation] || "0, 0"})`);
        if ([90, 270].includes(item.rotation)) {
          // we can not rotate img itself, so we change container's size via css margin hack, ...
          const ratio = item.naturalWidth / item.naturalHeight;
          filler = <div className={styles.filler} style={{ marginTop: `${ratio * 100}%` }} />;
          containerClassName += " " + styles.rotated;
          // ... prepare image size for transform rotation and use position: absolute
          imgStyle.width = `${ratio * 100}%`;
        }
      }

      if (imgTransform.length) {
        imgStyle["transform"] = imgTransform.join(" ");
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
            className={containerClassName}
            style={containerStyle}
          >
            {filler}
            <img
              ref={ref => {
                item.setImageRef(ref);
              }}
              style={imgStyle}
              src={item._value}
              onLoad={item.updateImageSize}
              onError={this.handleError}
              onClick={this.handleOnClick}
              alt="LS"
            />
          </div>
          {/* @todo this is dirty hack; rewrite to proper async waiting for data to load */}
          {item.stageWidth <= 1 ? null : (
            <Stage
              ref={ref => {
                item.setStageRef(ref);
              }}
              style={{ position: "absolute", top: 0, left: 0, brightness: "150%" }}
              className={"image-element"}
              width={item.stageComponentSize.width}
              height={item.stageComponentSize.height}
              scaleX={item.stageScale}
              scaleY={item.stageScale}
              x={item.zoomingPositionX}
              y={item.zoomingPositionY}
              onClick={this.handleOnClick}
              offsetX={item.stageTranslate.x}
              offsetY={item.stageTranslate.y}
              rotation={item.rotation}
              onMouseDown={this.handleMouseDown}
              onMouseMove={this.handleMouseMove}
              onMouseUp={this.handleMouseUp}
              onWheel={item.zoom ? this.handleZoom : () => {}}
            >
              {item.grid && item.sizeUpdated && <ImageGrid item={item} />}
              {regions.filter(s => s.type === "brushregion").map(Tree.renderItem)}
              {selected && selected.type === "brushregion" && Tree.renderItem(selected)}
              <Layer name="shapes">
                {regions.filter(s => s.type !== "brushregion").map(Tree.renderItem)}
                {selected && selected.type !== "brushregion" && Tree.renderItem(selected)}
                {selected?.editable && (
                  <ImageTransformer rotateEnabled={cb && cb.canrotate} selectedShape={item.selectedShape} />
                )}
              </Layer>
            </Stage>
          )}

          {this.renderTools()}
        </ObjectTag>
      );
    }
  },
);

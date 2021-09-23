import React, { Component } from "react";
import { MIN_SIZE } from "../../tools/Base";
import { fixRectToFit, getBoundingBoxAfterChanges } from "../../utils/image";
import LSTransformer from "./LSTransformer";
import { Rect } from "react-konva";
import { Portal } from "react-konva-utils";
import Constants from "../../core/Constants";

export default class TransformerComponent extends Component {
  backgroundRef = React.createRef()

  componentDidMount() {
    setTimeout(()=>this.checkNode());
  }

  componentDidUpdate() {
    setTimeout(()=>this.checkNode());
  }

  get freezeKey() {
    const freezeKey = `ImageTransformer_${this.props.item.id}`;

    return freezeKey;
  }

  freeze() {
    const { item } = this.props;
    const { freezeKey } = this;

    item.annotation.history.freeze(freezeKey);
  }

  unfreeze() {
    const { item } = this.props;
    const { freezeKey } = this;

    item.annotation.history.unfreeze(freezeKey);
  }

  checkNode() {
    if (!this.transformer) return;

    // here we need to manually attach or detach Transformer node
    const stage = this.transformer.getStage();
    const { item: { selectedRegions } } = this.props;

    if (!selectedRegions?.length) {
      this.transformer.detach();
      this.transformer.getLayer().batchDraw();
      return;
    }

    if (selectedRegions.find(shape => !shape.supportsTransform)) return;

    const selectedNodes = [];

    selectedRegions.forEach(shape => {
      const shapeContainer = stage.findOne(node => {
        return node.hasName(shape.id) && node.parent;
      });

      if (!shapeContainer) return;
      if (shapeContainer.hasName("_transformable")) selectedNodes.push(shapeContainer);
      if (!shapeContainer.find) return;

      const transformableElements = shapeContainer.find(node => {
        return node.hasName("_transformable");
      }, true);

      selectedNodes.push(...transformableElements);
    });
    const prevNodes = this.transformer.nodes();
    // do nothing if selected node is already attached

    if (selectedNodes?.length === prevNodes?.length && !selectedNodes.find((node, idx) => node !== prevNodes[idx])) {
      return;
    }

    if (selectedNodes.length) {
      // attach to another node
      if (this.backgroundRef.current) {
        selectedNodes.push(this.backgroundRef.current);
      }
      this.transformer.nodes(selectedNodes);
    } else {
      // remove transformer
      this.transformer.nodes([]);
    }
    this.transformer.getLayer().batchDraw();
  }

  constrainSizes = (oldBox, newBox) => {
    // it's important to compare against `undefined` because it can be missed (not rotated box?)
    const rotation = newBox.rotation !== undefined ? newBox.rotation : oldBox.rotation;
    const isRotated = rotation !== oldBox.rotation;

    const stage = this.transformer.getStage();

    if (newBox.width < MIN_SIZE) newBox.width = MIN_SIZE;
    if (newBox.height < MIN_SIZE) newBox.height = MIN_SIZE;

    // it's harder to fix sizes for rotated box, so just block changes out of stage
    if (rotation || isRotated) {
      const { x, y, width, height } = newBox;
      const selfRect = { x: 0, y: 0, width, height };

      // bounding box, got by applying current shift and rotation to normalized box
      const clientRect = getBoundingBoxAfterChanges(selfRect, { x, y }, rotation);
      const fixed = fixRectToFit(clientRect, stage.width(), stage.height());

      // if bounding box is out of stage — do nothing
      if (["x", "y", "width", "height"].some(key => fixed[key] !== clientRect[key])) return oldBox;
      return newBox;
    } else {
      return fixRectToFit(newBox, stage.width(), stage.height());
    }
  };

  dragBoundFunc = (pos) => {
    const { item } = this.props;
    
    return item.fixForZoomWrapper(pos,pos => {
      if (!this.transformer || !item) return;

      let { x, y } = pos;
      const { width, height } = this.draggingAreaBBox;
      const { stageHeight, stageWidth } = item;

      if (x < 0) x = 0;
      if (y < 0) y = 0;

      if (x + width > stageWidth) x = stageWidth - width;
      if (y + height > stageHeight) y = stageHeight - height;

      return { x, y };
    });
  }

  get draggableBackground() {
    const { draggableBackgroundAt, item } = this.props;
    const { selectedRegionsBBox } = item;

    return draggableBackgroundAt ? (
      <Portal selector={draggableBackgroundAt}>
        {selectedRegionsBBox && (
          <Rect
            ref={this.backgroundRef}
            x={selectedRegionsBBox.left}
            y={selectedRegionsBBox.top}
            width={selectedRegionsBBox.right-selectedRegionsBBox.left}
            height={selectedRegionsBBox.bottom-selectedRegionsBBox.top}
            fill="rgba(0,0,0,0)"
            draggable
            onClick={()=>{
              item.annotation.unselectAreas();
            }}
            onMouseOver={() => {
              if (!item.annotation.relationMode) {
                this.backgroundRef.current.getStage().container().style.cursor = Constants.POINTER_CURSOR;
              }
            }}
            onMouseOut={() => {
              this.backgroundRef.current.getStage().container().style.cursor = Constants.DEFAULT_CURSOR;
            }}
          />
        )}
      </Portal>
    ) : null;
  }

  render() {
    if (!this.props.supportsTransform) return null;
    const { draggableBackground } = this;

    return (
      <>
        { draggableBackground }
        <LSTransformer
          resizeEnabled={true}
          ignoreStroke={true}
          keepRatio={false}
          useSingleNodeRotation={this.props.rotateEnabled}
          rotateEnabled={this.props.rotateEnabled}
          borderDash={[3, 1]}
          // borderStroke={"red"}
          boundBoxFunc={this.constrainSizes}
          anchorSize={8}
          flipEnabled={false}
          onDragStart={e => {
            const { item: { selectedRegionsBBox } } = this.props;

            this.freeze();

            if (!this.transformer|| e.target !== e.currentTarget || !selectedRegionsBBox) return;

            this.draggingAreaBBox = {
              x: selectedRegionsBBox.left,
              y: selectedRegionsBBox.top,
              width: selectedRegionsBBox.right - selectedRegionsBBox.left,
              height: selectedRegionsBBox.bottom - selectedRegionsBBox.top,
            };
          }}
          dragBoundFunc={this.dragBoundFunc}
          onDragEnd ={() => {
            this.unfreeze();
          }}
          ref={node => {
            this.transformer = node;
          }}
        /></>
    );
  }
}

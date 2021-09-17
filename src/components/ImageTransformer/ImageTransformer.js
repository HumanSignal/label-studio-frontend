import React, { Component } from "react";
import { MIN_SIZE } from "../../tools/Base";
import { fixRectToFit, getBoundingBoxAfterChanges } from "../../utils/image";
import LSTransformer from "./LSTransformer";

export default class TransformerComponent extends Component {
  componentDidMount() {
    setTimeout(()=>this.checkNode());
  }

  componentDidUpdate() {
    setTimeout(()=>this.checkNode());
  }

  checkNode() {
    if (!this.transformer) return;

    // here we need to manually attach or detach Transformer node
    const stage = this.transformer.getStage();
    const { selectedShapes } = this.props;

    if (!selectedShapes?.length) {
      this.transformer.detach();
      this.transformer.getLayer().batchDraw();
      return;
    }

    if (selectedShapes.find(shape => !shape.supportsTransform)) return;

    const selectedNodes = [];

    selectedShapes.forEach(shape => {
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

  render() {
    if (!this.props.supportsTransform) return null;

    return (
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
          if (!this.transformer|| e.target !== e.currentTarget) return;
          const shape = this.transformer.findOne(".back");
          const x = shape.getAttr("width");
          const y = shape.getAttr("height");
          const width = shape.getAttr("width");
          const height = shape.getAttr("height");
          const rotation = shape.getAttr("rotation");

          this.draggingAreaBBox = getBoundingBoxAfterChanges(
            {
              x,
              y,
              width,
              height,
            },
            { x:0, y:0 },
            rotation,
          );
        }}
        dragBoundFunc={this.dragBoundFunc}
        ref={node => {
          this.transformer = node;
        }}
      />
    );
  }
}

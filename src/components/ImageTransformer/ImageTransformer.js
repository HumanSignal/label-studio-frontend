import React, { Component } from "react";
import { Transformer } from "react-konva";
import { MIN_SIZE } from "../../tools/Base";
import { fixRectToFit, getBoundingBoxAfterChanges } from "../../utils/image";

export default class TransformerComponent extends Component {
  componentDidMount () {
    this.checkNode();
  }

  componentDidUpdate () {
    this.checkNode();
  }

  checkNode () {
    if (!this.transformer) return;

    // here we need to manually attach or detach Transformer node
    const stage = this.transformer.getStage();
    const { selectedShape } = this.props;

    if (!selectedShape) {
      this.transformer.detach();
      this.transformer.getLayer().batchDraw();
      return;
    }

    if (!selectedShape.supportsTransform) return;

    const selectedNode = stage.findOne("." + selectedShape.id);
    // do nothing if selected node is already attached

    if (selectedNode === this.transformer.node()) {
      return;
    }

    if (selectedNode) {
      // attach to another node
      this.transformer.attachTo(selectedNode);
    } else {
      // remove transformer
      this.transformer.detach();
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

  render () {
    if (!this.props.selectedShape.supportsTransform) return null;

    return (
      <Transformer
        resizeEnabled={true}
        ignoreStroke={true}
        keepRatio={false}
        rotateEnabled={this.props.rotateEnabled}
        borderDash={[3, 1]}
        // borderStroke={"red"}
        boundBoxFunc={this.constrainSizes}
        anchorSize={8}
        ref={node => {
          this.transformer = node;
        }}
      />
    );
  }
}

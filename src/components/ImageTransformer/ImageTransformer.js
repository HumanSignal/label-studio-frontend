import React, { Component } from "react";
import { Transformer } from "react-konva";
import { MIN_SIZE } from "../../tools/Base";

export default class TransformerComponent extends Component {
  componentDidMount() {
    this.checkNode();
  }

  componentDidUpdate() {
    this.checkNode();
  }

  checkNode() {
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
    let { x, y, width, height, rotation } = newBox;
    let { stageHeight, stageWidth } = this.props.item;

    width = Math.max(MIN_SIZE.X, newBox.width);
    height = Math.max(MIN_SIZE.Y, newBox.height);

    if (x < 0) {
      width = width + x;
      x = 0;
    } else if (x + width > stageWidth) {
      width = stageWidth - x;
    }

    if (y < 0) {
      height = height + y;
      y = 0;
    } else if (y + height > stageHeight) {
      height = stageHeight - y;
    }

    return { x, y, width, height, rotation };
  };

  render() {
    if (!this.props.selectedShape.supportsTransform) return null;

    return (
      <Transformer
        resizeEnabled={true}
        ignoreStroke={true}
        keepRatio={false}
        rotateEnabled={this.props.rotateEnabled}
        borderDash={[3, 1]}
        boundBoxFunc={this.constrainSizes}
        anchorSize={8}
        ref={node => {
          this.transformer = node;
        }}
      />
    );
  }
}

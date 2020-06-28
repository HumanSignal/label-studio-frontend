import React, { Component } from "react";
import { Transformer } from "react-konva";

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

  render() {
    if (!this.props.selectedShape.supportsTransform) return null;

    return (
      <Transformer
        resizeEnabled={true}
        ignoreStroke={true}
        keepRatio={false}
        rotateEnabled={this.props.rotateEnabled}
        borderDash={[3, 1]}
        // borderStroke={"red"}
        boundBoxFunc={(oldBox, newBox) => {
          newBox.width = Math.max(3, newBox.width);
          newBox.height = Math.max(3, newBox.height);
          return newBox;
        }}
        anchorSize={8}
        ref={node => {
          this.transformer = node;
        }}
      />
    );
  }
}

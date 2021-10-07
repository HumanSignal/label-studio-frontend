import Konva from "konva";


const EVENTS_NAME = 'tr-konva';

class LSTransformer extends Konva.Transformer {
  _proxyDrag(node) {
    let lastPos;

    node.on(`dragstart.${EVENTS_NAME}`, (e) => {
      lastPos = node.getAbsolutePosition();
      if (!this.isDragging() && node !== this.findOne('.back')) {
        this.startDrag(e, false);
      }
      const nodeAbs = node.getAbsolutePosition();
      const transformerAbs = this.getAbsolutePosition();
      const offset = {
        x: nodeAbs.x - transformerAbs.x,
        y: nodeAbs.y - transformerAbs.y,
      };

      node.setAttr("transformerOffset", offset);
    });
    node.on(`dragmove.${EVENTS_NAME}`, (e) => {
      if (!lastPos) {
        return;
      }
      const abs = node.getAbsolutePosition();
      const dx = abs.x - lastPos.x;
      const dy = abs.y - lastPos.y;

      this.nodes().forEach((otherNode) => {
        if (otherNode === node) {
          return;
        }
        if (otherNode.isDragging() || !otherNode.getStage()) {
          return;
        }
        const otherAbs = otherNode.getAbsolutePosition();

        otherNode.setAbsolutePosition({
          x: otherAbs.x + dx,
          y: otherAbs.y + dy,
        });
        otherNode.startDrag(e);
      });
      lastPos = null;
    });
    this._proxyDragBoundFunc(node);
  }
  _proxyDragBoundFunc(node) {
    const dragBoundFunc = this.dragBoundFunc();

    node.setAttr("transformerDragBoundFunc", (pos)=>{
      const offset =  node.getAttr("transformerOffset");

      if (!offset) return;

      const newPos = dragBoundFunc.call(node, {
        x: pos.x - offset.x,
        y: pos.y - offset.y,
      });

      return {
        x: newPos.x + offset.x,
        y: newPos.y + offset.y,
      };
    });
  }
  detach(...args) {
    this.nodes().forEach((node) => {
      node.setAttr("transformerDragBoundFunc");
    });
    super.detach.apply(this, args);
  }
}
Konva["LSTransformer"] = LSTransformer;

export default "LSTransformer";

import Konva from "konva";

import IconRotate from '../../assets/icons/rotate.svg';

const EVENTS_NAME = "tr-konva";

class LSTransformer extends Konva.Transformer {
  constructor(props) {
    super();

    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.isMouseOver = false;
    this.isMouseDown = false;

    if (props.rotateEnabled)
      this.createRotateButton();
  }

  // Here starts the configuration of the rotation tool
  createRotateButton(){
    const rotateList = this.refreshRotationList();

    for (const obj in rotateList){
      const rotateButton = new Konva.Circle({
        radius: 10,
        name:`rotate-${obj}`,
        dragDistance: 0,
        draggable: true,
      });

      this.add(rotateButton);

      rotateButton.on('mousedown touchstart', this.handleMouseDown);

      rotateButton.on('mouseover', () => {
        if (!this.isMouseDown) {
          this.getStage().content.style.cursor = `url(${IconRotate}) 16 16, pointer`;
        }

        this.isMouseOver = true;
      });

      rotateButton.on('mouseout', () => {
        this.isMouseOver = false;

        if (!this.isMouseDown){
          this.getStage().content.style.cursor = ``;
        }
      });

      rotateButton.on('dragstart', (e) => {
        const anchorNode = this.findOne('.' + this._movingAnchorName);

        anchorNode.stopDrag();
        e.cancelBubble = true;
      });

      rotateButton.on('dragend', (e) => {
        e.cancelBubble = true;
      });
    }
  }

  getCenter(shape) {
    return {
      x: shape.x +
          (shape.width / 2) * Math.cos(shape.rotation) +
          (shape.height / 2) * Math.sin(-shape.rotation),
      y: shape.y +
          (shape.height / 2) * Math.cos(shape.rotation) +
          (shape.width / 2) * Math.sin(shape.rotation),
    };
  }

  rotateAroundPoint(shape, angleRad, point) {
    const x = point.x +
        (shape.x - point.x) * Math.cos(angleRad) -
        (shape.y - point.y) * Math.sin(angleRad);
    const y = point.y +
        (shape.x - point.x) * Math.sin(angleRad) +
        (shape.y - point.y) * Math.cos(angleRad);

    return Object.assign(Object.assign({}, shape), { rotation: shape.rotation + angleRad, x,
      y });
  }

  rotateAroundCenter(shape, deltaRad) {
    const center = this.getCenter(shape);

    return this.rotateAroundPoint(shape, deltaRad, center);
  }

  getSnap(snaps, newRotationRad, tol) {
    let snapped = newRotationRad;

    for (let i = 0; i < snaps.length; i++) {
      const angle = Konva.getAngle(snaps[i]);
      const absDiff = Math.abs(angle - newRotationRad) % (Math.PI * 2);
      const dif = Math.min(absDiff, Math.PI * 2 - absDiff);

      if (dif < tol) {
        snapped = angle;
      }
    }
    return snapped;
  }

  handleMouseDown(e) {
    this.getStage().content.style.cursor = `url(${IconRotate}) 16 16, pointer`;
    this.isMouseDown = true;
    this._movingAnchorName = e.target.name().split(' ')[0];
    const ap = e.target.getAbsolutePosition();
    const pos = e.target.getStage().getPointerPosition();

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('touchmove', this.handleMouseMove);
      window.addEventListener('mouseup', this.handleMouseUp, true);
      window.addEventListener('touchend', this.handleMouseUp, true);
    }

    this._anchorDragOffset = {
      x: pos.x - ap.x,
      y: pos.y - ap.y,
    };

    this._fire('transformstart', { evt: e, target: this.getNode() });
    this._nodes.forEach((target) => {
      target._fire('transformstart', { evt: e, target });
    });
  }

  handleMouseUp(e){
    this.isMouseDown = false;

    if (!this.isMouseOver) {
      this.getStage().content.style.cursor = ``;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('touchmove', this.handleMouseMove);
      window.removeEventListener('mouseup', this.handleMouseUp, true);
      window.removeEventListener('touchend', this.handleMouseUp, true);
    }

    const node = this.getNode();

    this._fire('transformend', { evt: e, target: node });
    if (node) {
      this._nodes.forEach((target) => {
        target._fire('transformend', { evt: e, target });
      });
    }
    this._movingAnchorName = null;
  }

  handleMouseMove(e) {
    const anchorNode = this.findOne('.' + this._movingAnchorName);
    const stage = this.getStage();

    if (this.isMouseDown) {
      this.getStage().content.style.cursor = `url(${IconRotate}) 16 16, pointer`;
    }

    stage.setPointersPositions(e);
    const pp = stage.getPointerPosition();
    const oldAbs = anchorNode.getAbsolutePosition();
    let newNodePos = {
      x: pp.x - this._anchorDragOffset.x,
      y: pp.y - this._anchorDragOffset.y,
    };

    if (this.anchorDragBoundFunc()) {
      newNodePos = this.anchorDragBoundFunc()(oldAbs, newNodePos, e);
    }

    anchorNode.setAbsolutePosition(newNodePos);
    const newAbs = anchorNode.getAbsolutePosition();

    if (oldAbs.x === newAbs.x && oldAbs.y === newAbs.y) {
      return;
    }

    stage.setPointersPositions(e);

    let x, y, delta, newRotation;
    const attrs = this._getNodeRect();
    const oldRotation = Konva.getAngle(this.rotation());

    if (this._movingAnchorName.indexOf('rotate-bottom') >= 0) {
      x = anchorNode.x() + (attrs.width);
      y = -anchorNode.y() + (attrs.height);
    } else {
      x = anchorNode.x() + (attrs.width);
      y = -anchorNode.y() + 10;
    }

    delta = Math.atan2(-y, x) + Math.PI;

    if (attrs.width > 0) {
      delta += Math.PI;
    }

    if (this._movingAnchorName.indexOf('right') >= 0) {
      newRotation = oldRotation + delta;
    } else {
      newRotation = oldRotation - delta;
    }

    const tol = Konva.getAngle(this.rotationSnapTolerance());
    const snappedRot = this.getSnap(this.rotationSnaps(), newRotation, tol);
    const diff = snappedRot - attrs.rotation;
    const shape = this.rotateAroundCenter(attrs, diff);

    this._fitNodesInto(shape, e);
  }

  refreshRotationList() {
    return {
      "top-left": {
        x: -15,
        y: -15,
      },
      "top-right": {
        x: this.getWidth() + 15,
        y: -15,
      },
      "bottom-left": {
        x: -15,
        y: this.getHeight() + 10,
      },
      "bottom-right": {
        x: this.getWidth() + 15,
        y: this.getHeight() + 15,
      },
      "top-left-inside": {
        x: 15,
        y: 15,
      },
      "top-right-inside": {
        x: this.getWidth() - 15,
        y: 15,
      },
      "bottom-left-inside": {
        x: 15,
        y: this.getHeight() - 15,
      },
      "bottom-right-inside": {
        x: this.getWidth() - 15,
        y: this.getHeight() - 15,
      },
    };
  }

  // Here starts override methods from LSTransform

  get _outerBack() {
    return this.getStage()?.findOne(this.attrs.backSelector);
  }

  setNodes(nodes = []) {
    super.setNodes(nodes);

    if (this._outerBack) {
      this._proxyDrag(this._outerBack);
    }
    return this;
  }

  detach() {
    this._outerBack?.off("." + EVENTS_NAME);

    super.detach();
  }

  update() {
    this.refreshRotationList();

    const { x, y, width, height } = this._getNodeRect();
    const rotation = this.rotation();
    const outerBack = this._outerBack;
    const rotateList = this.refreshRotationList();

    for(const obj in rotateList){
      const anchorNode = this.findOne(`.rotate-${obj}`);

      if (anchorNode) {
        anchorNode.setAttrs({
          x: rotateList[obj].x,
          y: rotateList[obj].y,
        }).getLayer().batchDraw();
      }
    }

    super.update();

    if (outerBack) {
      const backAbsScale = this.getAbsoluteScale();
      const trAbsScale = outerBack.getAbsoluteScale();
      const scale = {
        x: backAbsScale.x / trAbsScale.x,
        y: backAbsScale.y / trAbsScale.y,
      };

      outerBack.setAttrs({
        x: (x - this.getStage().getAttr("x")) * scale.x,
        y: (y - this.getStage().getAttr("y")) * scale.y,
        width: width * scale.x,
        height: height * scale.y,
        rotation,
      }).getLayer().batchDraw();
    }
  }
}

Konva["LSTransformer"] = LSTransformer;

export default "LSTransformer";

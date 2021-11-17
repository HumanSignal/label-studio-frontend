import Konva from "konva";

export function reverseCoordinates(r1, r2) {
  let r1X = r1.x,
    r1Y = r1.y,
    r2X = r2.x,
    r2Y = r2.y,
    d;

  if (r1X > r2X) {
    d = Math.abs(r1X - r2X);
    r1X = r2X;
    r2X = r1X + d;
  }

  if (r1Y > r2Y) {
    d = Math.abs(r1Y - r2Y);
    r1Y = r2Y;
    r2Y = r1Y + d;
  }
  /**
   * Return the corrected rect
   */
  return { x1: r1X, y1: r1Y, x2: r2X, y2: r2Y };
}

/**
 * Transform RGBA Canvas to Binary Matrix
 * @param {object} canvas
 * @param {object} shape
 */
export function canvasToBinaryMatrix(canvas, shape) {
  const currentLayer = canvas.stageRef.getLayers().filter(layer => layer.attrs.id === shape.id);

  const canv = currentLayer[0].canvas.context;

  const initialArray = canv.getImageData(0, 0, canv.canvas.width, canv.canvas.height);

  const binaryMatrix = [];

  for (
    let i = 0;
    i < canvas.stageRef.bufferCanvas.context.canvas.width * canvas.stageRef.bufferCanvas.context.canvas.height * 4;
    i += 4
  ) {
    const alpha = initialArray.data[i + 0];
    const r = initialArray.data[i + 1];
    const g = initialArray.data[i + 2];
    const b = initialArray.data[i + 3];

    if (alpha > 0 || r > 0 || g > 0 || b > 0) {
      binaryMatrix.push(1);
    } else {
      binaryMatrix.push(0);
    }
  }

  return binaryMatrix;
}

/**
 * Apply transform to rect and calc bounding box around it
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {Konva.Transform} transform
 */
export function getBoundingBoxAfterTransform(rect, transform) {
  const points = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  let minX, minY, maxX, maxY;

  points.forEach(point => {
    const transformed = transform.point(point);

    if (minX === undefined) {
      minX = maxX = transformed.x;
      minY = maxY = transformed.y;
    }
    minX = Math.min(minX, transformed.x);
    minY = Math.min(minY, transformed.y);
    maxX = Math.max(maxX, transformed.x);
    maxY = Math.max(maxY, transformed.y);
  });
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Apply changes to rect (shift to (x, y) and rotate) and calc bounding box around it
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {{ x: number, y: number }} shiftPoint
 * @param {number} degRotation
 */
export function getBoundingBoxAfterChanges(rect, shiftPoint, degRotation = 0) {
  const transform = new Konva.Transform();

  transform.translate(shiftPoint.x, shiftPoint.y);
  transform.rotate((degRotation * Math.PI) / 180);
  return getBoundingBoxAfterTransform(rect, transform);
}

/**
 * Crop rect to fit into canvas with given dimensions
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} stageWidth
 * @param {number} stageHeight
 */
export function fixRectToFit(rect, stageWidth, stageHeight) {
  let { x, y, width, height } = rect;

  if (x < 0) {
    width += x;
    x = 0;
  } else if (x + width > stageWidth) {
    width = stageWidth - x;
  }

  if (y < 0) {
    height += y;
    y = 0;
  } else if (y + height > stageHeight) {
    height = stageHeight - y;
  }

  return { ...rect, x, y, width, height };
}

export function createDragBoundFunc(image, cb) {
  return function(pos) {
    const transformerFunc = this.getAttr("transformerDragBoundFunc");

    if (transformerFunc) {
      return transformerFunc(pos);
    } else {
      return image.fixForZoomWrapper(pos, cb);
    }
  };
}

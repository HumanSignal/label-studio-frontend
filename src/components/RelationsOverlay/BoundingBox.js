import { Geometry } from "./Geometry";

/**
 * Provides an abstract boudnign box for any types of regions
 */
export class BoundingBox {
  options = {};

  /**
   * Contructor
   *
   * _source_ might be any object that provides its dimensions and position
   *
   * @param {{
   * source: any,
   * getX: (any) => number,
   * getY: (any) => number,
   * getXWidth: (any) => number,
   * getHeight: (any) => number
   * }} options
   */
  constructor(options) {
    Object.assign(this.options, options);
  }

  get _source() {
    return this.options.source;
  }

  get x() {
    return this.options.getX(this._source);
  }

  get y() {
    return this.options.getY(this._source);
  }

  get width() {
    return this.options.getWidth(this._source);
  }

  get height() {
    return this.options.getHeight(this._source);
  }
}

/**
 * @type {import("./Geometry").BBox}
 */
const DEFAULT_BBOX = { x: 0, y: 0, width: 0, height: 0 };

const _detect = region => {
  switch (region.type) {
    case "textrange":
    case "hypertextregion":
    case "textarearegion":
    case "audioregion": {
      return Geometry.getDOMBBox(region.regionElement);
    }
    case "rectangleregion": {
      const imageBbox = Geometry.getDOMBBox(region.parent.imageRef);
      const bbox = Geometry.scaleBBox(
        Geometry.getRectBBox(region.x, region.y, region.width, region.height, region.rotation),
        region.parent.zoomScale,
      );
      return {
        ...bbox,
        x: imageBbox.x + bbox.x,
        y: imageBbox.y + bbox.y,
      };
    }
    case "ellipseregion": {
      const imageBbox = Geometry.getDOMBBox(region.parent.imageRef);
      const bbox = Geometry.scaleBBox(
        Geometry.getEllipseBBox(region.x, region.y, region.radiusX, region.radiusY, region.rotation),
        region.parent.zoomScale,
      );
      return {
        ...bbox,
        x: imageBbox.x + bbox.x,
        y: imageBbox.y + bbox.y,
      };
    }
    case "polygonregion": {
      const imageBbox = Geometry.getDOMBBox(region.parent.imageRef);
      const bbox = Geometry.scaleBBox(Geometry.getPolygonBBox(region.points), region.parent.zoomScale);
      return {
        ...bbox,
        x: imageBbox.x + bbox.x,
        y: imageBbox.y + bbox.y,
      };
    }
    case "keypointregion": {
      const imageBbox = Geometry.getDOMBBox(region.parent.imageRef);
      const scale = region.parent.zoomScale;
      return {
        x: region.x * scale + imageBbox.x - 2,
        y: region.y * scale + imageBbox.y - 2,
        width: 4,
        height: 4,
      };
    }
    case "brushregion": {
      const imageBbox = Geometry.getDOMBBox(region.parent.imageRef);
      const points = [].concat(...region.touches.filter(t => t.type === "add").map(t => t.points));
      const bbox = Geometry.scaleBBox(Geometry.getBrushBBox(points), region.parent.zoomScale);
      return {
        ...bbox,
        x: imageBbox.x + bbox.x,
        y: imageBbox.y + bbox.y,
      };
    }
    default: {
      console.warn(`Unknown region type: ${region.type}`);
      return { ...DEFAULT_BBOX };
    }
  }
};

export const getRegionBoundingBox = region => {
  const result = _detect(region);

  return Object.assign({ ...DEFAULT_BBOX }, result);
};

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

const DEFAULT_BBOX = { x: 0, y: 0, width: 0, height: 0 };

const _getEllipseBBox = (x, y, rx, ry, angle) => {
  const angleRad = ((angle + 360) % 360) * (Math.PI / 180);
  const major = Math.max(rx, ry) * 2;
  const minor = Math.min(rx, ry) * 2;

  const getXLimits = () => {
    const t = Math.atan(((-minor / 2) * Math.tan(angleRad)) / (major / 2));

    return [t, t + Math.PI]
      .map(t => {
        return x + (major / 2) * Math.cos(t) * Math.cos(angleRad) - (minor / 2) * Math.sin(t) * Math.sin(angleRad);
      })
      .sort((a, b) => b - a);
  };

  const getYLimits = () => {
    const t = Math.atan(((minor / 2) * 1.0) / Math.tan(angleRad) / (major / 2));
    return [t, t + Math.PI]
      .map(t => {
        return y + (minor / 2) * Math.sin(t) * Math.cos(angleRad) + (major / 2) * Math.cos(t) * Math.sin(angleRad);
      })
      .sort((a, b) => b - a);
  };

  const [x1, x2] = getXLimits();
  const [y1, y2] = getYLimits();
  const width = x1 - x2;
  const height = y1 - y2;

  return { x: x2, y: y2, width, height };
};

const _detect = region => {
  switch (region.type) {
    default:
      console.warn(`Unknown region type: ${region.type}`);
      return { ...DEFAULT_BBOX };
    case "textrange": {
      const bbox = region._spans[0].getBoundingClientRect();
      return {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      };
    }
    case "rectangleregion": {
      const imageBbox = region.parent.imageRef.getBoundingClientRect();
      return {
        x: imageBbox.x + region.x,
        y: imageBbox.y + region.y,
        width: region.width,
        height: region.height,
      };
    }
    case "ellipseregion": {
      const imageBbox = region.parent.imageRef.getBoundingClientRect();
      const bbox = _getEllipseBBox(region.x, region.y, region.radiusX, region.radiusY, region.rotation);
      return {
        ...bbox,
        x: imageBbox.x + bbox.x,
        y: imageBbox.y + bbox.y,
      };
    }
  }
};

export const getRegionBoundingBox = region => {
  const result = _detect(region);

  return Object.assign({ ...DEFAULT_BBOX }, result);
};

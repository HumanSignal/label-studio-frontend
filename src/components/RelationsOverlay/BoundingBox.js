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

const _normalizeAngle = angle => {
  return ((angle + 360) % 360) * (Math.PI / 180);
};

const _getEllipseBBox = (x, y, rx, ry, angle) => {
  const angleRad = _normalizeAngle(angle);
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

const _getPointsBBox = points => {
  const minmax = [null, null, null, null];
  points.forEach((num, i) => {
    const pos = Math.round(i / 2) * 2 - i;

    if (pos === 0) {
      // Calculate min and max X
      if (minmax[0] === null || minmax[0] >= num) minmax[0] = num;
      if (minmax[2] === null || minmax[2] <= num) minmax[2] = num;
    } else if (pos === 1) {
      // Calculate min and max Y
      if (minmax[1] === null || minmax[1] >= num) minmax[1] = num;
      if (minmax[3] === null || minmax[3] <= num) minmax[3] = num;
    }
  });

  return minmax;
};

const _getRectBBox = (x, y, width, height, angle) => {
  const angleRad = _normalizeAngle(angle);

  const rotate = (x1, y1) => [
    (x1 - x) * Math.cos(angleRad) - (y1 - y) * Math.sin(angleRad) + x,
    (x1 - x) * Math.sin(angleRad) + (y1 - y) * Math.cos(angleRad) + y,
  ];

  const [rx1, ry1, rx2, ry2] = _getPointsBBox([
    x,
    y,
    ...rotate(x + width, y),
    ...rotate(x + width, y + height),
    ...rotate(x, y + height),
  ]);

  return { x: rx1, y: ry1, width: rx2 - rx1, height: ry2 - ry1 };
};

const _getPolygonBBox = points => {
  const coords = points.reduce((res, point) => [...res, point.x, point.y], []);
  const [x1, y1, x2, y2] = _getPointsBBox(coords);
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
};

const _getBrushBBox = points => {
  const [x1, y1, x2, y2] = _getPointsBBox(points);
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
};

const _detect = region => {
  switch (region.type) {
    case "textrange":
    case "hypertextregion": {
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
      const bbox = _getRectBBox(region.x, region.y, region.width, region.height, region.rotation);
      return {
        ...bbox,
        x: imageBbox.x + bbox.x,
        y: imageBbox.y + bbox.y,
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
    case "polygonregion": {
      const imageBbox = region.parent.imageRef.getBoundingClientRect();
      const bbox = _getPolygonBBox(region.points);
      return {
        ...bbox,
        x: imageBbox.x + bbox.x,
        y: imageBbox.y + bbox.y,
      };
    }
    case "keypointregion": {
      const imageBbox = region.parent.imageRef.getBoundingClientRect();
      return {
        x: region.x + imageBbox.x - 2,
        y: region.y + imageBbox.y - 2,
        width: 4,
        height: 4,
      };
    }
    case "brushregion": {
      const imageBbox = region.parent.imageRef.getBoundingClientRect();
      const bbox = _getBrushBBox([].concat(...region.touches.filter(t => t.type === "add").map(t => t.points)));
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

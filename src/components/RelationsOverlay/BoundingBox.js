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

const _detect = region => {
  switch (region.type) {
    default:
      console.warn(`Unknown region type: ${region.type}`);
      return { ...DEFAULT_BBOX };
    case "textrange":
      const bbox = region._spans[0].getBoundingClientRect();
      return {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      };
    case "rectangleregion":
      const imageBbox = region.parent.imageRef.getBoundingClientRect();
      return {
        x: imageBbox.x + region.x,
        y: imageBbox.y + region.y,
        width: region.width,
        height: region.height,
      };
  }
};

export const getRegionBoundingBox = region => {
  const result = _detect(region);

  return Object.assign({ ...DEFAULT_BBOX }, result);
};

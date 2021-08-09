import { wrapArray } from "../../utils/utilities";
import { Geometry } from "./Geometry";

/**
 * @type {import("./Geometry").BBox}
 */
const DEFAULT_BBOX = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Provides an abstract boudnign box for any types of regions
 */
export class BoundingBox {
  options = {};

  static bbox(region) {
    const bbox = _detect(region);

    return wrapArray(bbox).map(bbox => Object.assign({ ...DEFAULT_BBOX }, bbox));
  }

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

const imageRelatedBBox = (region, bbox) => {
  const imageBbox = Geometry.getDOMBBox(region.parent.stageRef.content, true);

  return Geometry.clampBBox({
    ...bbox,
    x: imageBbox.x + bbox.x,
    y: imageBbox.y + bbox.y,
  },
  { x:0, y:0 },
  { x:region.parent.stageWidth, y:region.parent.stageHeight },
  );
};

const stageRelatedBBox = (region, bbox) => {
  const imageBbox = Geometry.getDOMBBox(region.parent.stageRef.content, true);
  const transformedBBox = Geometry.clampBBox(
    Geometry.modifyBBoxCoords(bbox, region.parent.zoomOriginalCoords),
    { x:0, y:0 },
    { x:region.parent.stageWidth, y:region.parent.stageHeight },
  );

  return {
    ...transformedBBox,
    x: imageBbox.x + transformedBBox.x,
    y: imageBbox.y + transformedBBox.y,
  };
};

const _detect = region => {
  switch (region.type) {
    case "textrange":
    case "richtextregion":
    case "textarearegion":
    case "audioregion":
    case "paragraphs":
    case "timeseriesregion": {
      return Geometry.getDOMBBox(region.getRegionElement());
    }
    case "rectangleregion": {
      return stageRelatedBBox(
        region,
        Geometry.getRectBBox(region.x, region.y, region.width, region.height, region.rotation),
      );
    }
    case "ellipseregion": {
      return stageRelatedBBox(
        region,
        Geometry.getEllipseBBox(region.x, region.y, region.radiusX, region.radiusY, region.rotation),
      );
    }
    case "polygonregion": {
      return stageRelatedBBox(region, Geometry.getPolygonBBox(region.points));
    }
    case "keypointregion": {
      const imageBbox = Geometry.getDOMBBox(region.parent.imageRef, true);
      const scale = region.parent.zoomScale;

      return {
        x: region.x * scale + imageBbox.x - 2,
        y: region.y * scale + imageBbox.y - 2,
        width: region.width,
        height: region.width,
      };
    }
    case "brushregion": {
      return imageRelatedBBox(
        region,
        Geometry.getImageDataBBox(region.imageData.data, region.imageData.width, region.imageData.height),
      );
    }
    default: {
      console.warn(`Unknown region type: ${region.type}`);
      return { ...DEFAULT_BBOX };
    }
  }
};

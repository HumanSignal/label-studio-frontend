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
  const clampedBbox = Geometry.clampBBox(bbox,
    { x:0, y:0 },
    { x:region.parent.stageWidth, y:region.parent.stageHeight },
  );

  return {
    ...clampedBbox,
    x: imageBbox.x + clampedBbox.x,
    y: imageBbox.y + clampedBbox.y,
  };
};

const stageRelatedBBox = (region, bbox) => {
  // If there is no stageRef we just wait for it in the next renders
  if (!region.parent?.stageRef) return null;
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
      // If there is no imageData we just wait for the next render
      return region.imageData && imageRelatedBBox(
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

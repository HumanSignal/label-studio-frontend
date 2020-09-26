/**
 * @typedef {{x: number, y: number, width: number, height: number}} BBox
 *
 * @typedef {number[]} Points Represents (x,y) flat array, meaning
 * each two numbers represent x and y accordingly. Array always starts with x
 *
 */

export class Geometry {
  /**
   * Returns RAD angle to normalized degrees meaning that it will always fit 0-360 range
   * @param {number} angle Angle in RAD
   */
  static normalizeAngle(angle) {
    return ((angle + 360) % 360) * (Math.PI / 180);
  }

  /**
   * Calculate BBox for any number of coordinates
   * @param {Points} points Input points
   * @returns {Points} Array of two (x,y) coordinates representing a BBox
   */
  static getPointsBBox(points) {
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
  }

  /**
   * Scale given BBox by a scale factor
   * @param {BBox} bbox Original BBox
   * @param {number} scale Scale factor
   * @returns {BBox} Scaled BBox
   */
  static scaleBBox(bbox, scale = 1) {
    return {
      ...bbox,
      x: bbox.x * scale,
      y: bbox.y * scale,
      width: bbox.width * scale,
      height: bbox.height * scale,
    };
  }

  /**
   * Calculate ellipse BBox
   * @param {number} x Center X
   * @param {number} y Center Y
   * @param {number} rx Radius X
   * @param {number} ry Radius Y
   * @param {number} angle Angle in RAD
   * @returns {BBox} Dimensions of bounding box
   */
  static getEllipseBBox(x, y, rx, ry, angle) {
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
  }

  /**
   * Calculate rotated rect BBox
   * @param {number} x Top left X
   * @param {number} y Top left Y
   * @param {number} width Width
   * @param {number} height Height
   * @param {number} angle Angle in RAD
   * @returns {BBox} Dimensions of bounding box
   */
  static getRectBBox(x, y, width, height, angle) {
    const angleRad = this._normalizeAngle(angle);

    const rotate = (x1, y1) => [
      (x1 - x) * Math.cos(angleRad) - (y1 - y) * Math.sin(angleRad) + x,
      (x1 - x) * Math.sin(angleRad) + (y1 - y) * Math.cos(angleRad) + y,
    ];

    const [rx1, ry1, rx2, ry2] = this.getPointsBBox([
      x,
      y,
      ...rotate(x + width, y),
      ...rotate(x + width, y + height),
      ...rotate(x, y + height),
    ]);

    return { x: rx1, y: ry1, width: rx2 - rx1, height: ry2 - ry1 };
  }

  /**
   * Calculate BBox of polygon shape
   * @param {Points} points
   * @return {BBox}
   */
  static getPolygonBBox(points) {
    const coords = points.reduce((res, point) => [...res, point.x, point.y], []);
    const [x1, y1, x2, y2] = this.getPointsBBox(coords);
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }

  /**
   * Calculate BBox of Brush region (a set of points)
   * @param {Points} points
   * @return {BBox}
   */
  static getBrushBBox(points) {
    const [x1, y1, x2, y2] = this.getPointsBBox(points);
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }

  /**
   * Get BBox of any DOM node
   * @param {HTMLElement} domNode
   * @return {BBox}
   */
  static getDOMBBox(domNode) {
    const bbox = domNode.getBoundingClientRect();
    return {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    };
  }
}

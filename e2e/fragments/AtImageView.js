/* global inject */
const { I } = inject();

const {
  waitForImage,
  clickKonva,
  polygonKonva,
  clickMultipleKonva,
  dragKonva,
  hasKonvaPixelColorAtPoint,
  whereIsPixel,
  getCanvasSize,
  setZoom,
} = require("../tests/helpers");

module.exports = {
  waitForImage() {
    I.executeAsyncScript(waitForImage);
  },

  async getCanvasSize() {
    const sizes = await I.executeAsyncScript(getCanvasSize);
    return sizes;
  },

  setZoom(scale, x, y) {
    I.executeAsyncScript(setZoom, scale, x, y);
  },

  /**
   * Click once on the main Stage
   * @param {number} x
   * @param {number} y
   */
  clickKonva(x, y) {
    I.executeAsyncScript(clickKonva, x, y);
  },
  /**
   * Click multiple times on the main Stage
   * @param {number[][]} points
   */
  clickPointsKonva(points) {
    I.executeAsyncScript(clickMultipleKonva, points);
  },
  /**
   * Click multiple times on the main Stage then close Polygon
   * @param {number[][]} points
   */
  clickPolygonPointsKonva(points) {
    I.executeAsyncScript(polygonKonva, points);
  },
  /**
   * Dragging between two points
   * @param {number} x
   * @param {number} y
   * @param {number} shiftX
   * @param {number} shiftY
   */
  dragKonva(x, y, shiftX, shiftY) {
    I.executeAsyncScript(dragKonva, x, y, shiftX, shiftY);
  },
  /**
   * Get  pixel color at point
   * @param {number} x
   * @param {number} y
   * @param {number[]} rgbArray
   * @param {number} tolerance
   */
  async hasPixelColor(x, y, rgbArray, tolerance = 3) {
    const hasPixel = await I.executeAsyncScript(hasKonvaPixelColorAtPoint, x, y, rgbArray, tolerance);
    return hasPixel;
  },
  // Only for debugging
  async whereIsPixel(rgbArray, tolerance = 3) {
    const points = await I.executeAsyncScript(whereIsPixel, rgbArray, tolerance);
    return points;
  },
};

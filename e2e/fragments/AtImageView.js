/* global inject */
const { I } = inject();

const Helpers = require("../tests/helpers");

module.exports = {
  _stageSelector: ".konvajs-content",
  _stageBBox: { x: 0, y: 0, width: 0, height: 0 },

  async grabStageBBox() {
    const bbox = await I.grabElementBoundingRect(this._stageSelector);

    return bbox;
  },

  async lookForStage() {
    I.scrollPageToTop();
    const bbox = await I.grabElementBoundingRect(this._stageSelector);

    this._stageBBox = bbox;
  },

  waitForImage() {
    I.executeAsyncScript(Helpers.waitForImage);
    I.waitForVisible("canvas", 5);
  },

  async getCanvasSize() {
    const sizes = await I.executeAsyncScript(Helpers.getCanvasSize);

    return sizes;
  },

  async getImageSize() {
    const sizes = await I.executeAsyncScript(Helpers.getImageSize);

    return sizes;
  },

  async getImageFrameSize() {
    const sizes = await I.executeAsyncScript(Helpers.getImageFrameSize);

    return sizes;
  },

  setZoom(scale, x, y) {
    I.executeAsyncScript(Helpers.setZoom, scale, x, y);
  },

  /**
   * Click once on the main Stage
   * @param {number} x
   * @param {number} y
   */
  clickKonva(x, y) {
    I.executeAsyncScript(Helpers.clickKonva, x, y);
  },
  /**
   * Click multiple times on the main Stage
   * @param {number[][]} points
   */
  clickPointsKonva(points) {
    I.executeAsyncScript(Helpers.clickMultipleKonva, points);
  },
  /**
   * Click multiple times on the main Stage then close Polygon
   * @param {number[][]} points
   * @deprecated Use drawByClickingPoints instead
   */
  clickPolygonPointsKonva(points) {
    I.executeAsyncScript(Helpers.polygonKonva, points);
  },
  /**
   * Dragging between two points
   * @param {number} x
   * @param {number} y
   * @param {number} shiftX
   * @param {number} shiftY
   * @deprecated Use drawByDrag instead
   */
  dragKonva(x, y, shiftX, shiftY) {
    I.executeAsyncScript(Helpers.dragKonva, x, y, shiftX, shiftY);
  },

  /**
   * Get  pixel color at point
   * @param {number} x
   * @param {number} y
   * @param {number[]} rgbArray
   * @param {number} tolerance
   */
  async hasPixelColor(x, y, rgbArray, tolerance = 3) {
    const colorPixels = await I.executeAsyncScript(Helpers.getKonvaPixelColorFromPoint, x, y);
    const hasPixel = Helpers.areEqualRGB(rgbArray, colorPixels, tolerance);

    return hasPixel;
  },

  // Only for debugging
  async whereIsPixel(rgbArray, tolerance = 3) {
    const points = await I.executeAsyncScript(Helpers.whereIsPixel, rgbArray, tolerance);

    return points;
  },

  async countKonvaShapes() {
    const count = await I.executeAsyncScript(Helpers.countKonvaShapes);

    return count;
  },

  async isTransformerExist() {
    const isTransformerExist = await I.executeAsyncScript(Helpers.isTransformerExist);

    return isTransformerExist;
  },

  async isRotaterExist() {
    const isRotaterExist = await I.executeAsyncScript(Helpers.isRotaterExist);

    return isRotaterExist;
  },

  /**
   * Mousedown - mousemove - mouseup drawing on the ImageView. Works in couple of lookForStage.
   * @example
   * async AtImageView.lookForStage();
   * AtImageView.drawByDrag(50, 30, 200, 200);
   * @param x
   * @param y
   * @param shiftX
   * @param shiftY
   */
  drawByDrag(x, y, shiftX, shiftY) {
    I.scrollPageToTop();
    I.moveMouse(this._stageBBox.x + x, this._stageBBox.y + y);
    I.pressMouseDown();
    I.moveMouse(this._stageBBox.x + x + shiftX, this._stageBBox.y + y + shiftY, 3);
    I.pressMouseUp();
  },
  /**
   * Click through the list of points on the ImageView. Works in couple of lookForStage.
   * @example
   * async AtImageView.loolookkForStage();
   * AtImageView.drawByClickingPoints([[50,50],[100,50],[100,100],[50,100],[50,50]]);
   * @param {number[][]} points
   */
  drawByClickingPoints(points) {
    const lastPoint = points[points.length - 1];
    const prevPoints = points.slice(0, points.length - 1);

    I.scrollPageToTop();

    if (prevPoints.length) {
      for (const point of prevPoints) {
        I.clickAt(this._stageBBox.x + point[0], this._stageBBox.y + point[1]);
      }
      I.wait(0.5); // wait before last click to fix polygons creation
    }

    I.clickAt(this._stageBBox.x + lastPoint[0], this._stageBBox.y + lastPoint[1]);
  },
  /**
   * Mousedown - mousemove - mouseup drawing through the list of points on the ImageView. Works in couple of lookForStage.
   * @example
   * async AtImageView.lookForStage();
   * AtImageView.drawThroughPoints([[50,50],[200,100],[50,200],[300,300]]);
   * @param {number[][]} points - list of pairs of coords
   * @param {"steps"|"rate"} mode - mode of firing mousemove event
   * @param {number} parameter - parameter for mode
   */
  drawThroughPoints(points, mode = "steps", parameter = 1) {
    I.scrollPageToTop();
    const calcSteps = {
      steps: () => parameter,
      rate: (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2)) / parameter,
    }[mode];
    const startPoint = points[0];

    I.moveMouse(this._stageBBox.x + startPoint[0], this._stageBBox.y + startPoint[1]);
    I.pressMouseDown();
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const curPoint = points[i];

      I.moveMouse(this._stageBBox.x + curPoint[0], this._stageBBox.y + curPoint[1], calcSteps(prevPoint, curPoint));
    }
    I.pressMouseUp();
  },
  clickAt(x, y) {
    I.scrollPageToTop();
    I.clickAt(this._stageBBox.x + x, this._stageBBox.y + y);
  },
  dblClickAt(x, y) {
    I.scrollPageToTop();
    I.clickAt(this._stageBBox.x + x, this._stageBBox.y + y);
    I.clickAt(this._stageBBox.x + x, this._stageBBox.y + y);
  },
  drawByClick(x, y) {
    I.scrollPageToTop();
    this.clickAt(x, y);
  },
};

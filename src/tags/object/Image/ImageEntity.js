import { types } from 'mobx-state-tree';

export const ImageEntity = types.model({
  id: types.identifier,
  src: types.string,
  index: types.number,

  rotation: types.optional(types.number, 0),

  /**
   * Natural sizes of Image
   * Constants
   */
  naturalWidth: types.optional(types.integer, 1),
  naturalHeight: types.optional(types.integer, 1),

  stageWidth: types.optional(types.number, 1),
  stageHeight: types.optional(types.number, 1),

  /**
   * Zoom Scale
   */
  zoomScale: types.optional(types.number, 1),

  /**
     * Coordinates of left top corner
     * Default: { x: 0, y: 0 }
     */
  zoomingPositionX: types.optional(types.number, 0),
  zoomingPositionY: types.optional(types.number, 0),

  /**
     * Brightness of Canvas
     */
  brightnessGrade: types.optional(types.number, 100),

  contrastGrade: types.optional(types.number, 100),
}).volatile(() => ({
  stageRatio: 1,
  // Container's sizes causing limits to calculate a scale factor
  containerWidth: 1,
  containerHeight: 1,

  stageZoom: 1,
  stageZoomX: 1,
  stageZoomY: 1,
  currentZoom: 1,
})).actions(self => ({
  setRotation(angle) {
    self.rotation = angle;
  },

  setNaturalWidth(width) {
    self.naturalWidth = width;
  },

  setNaturalHeight(height) {
    self.naturalHeight = height;
  },

  setStageWidth(width) {
    self.stageWidth = width;
  },

  setStageHeight(height) {
    self.stageHeight = height;
  },

  setStageRatio(ratio) {
    self.stageRatio = ratio;
  },

  setContainerWidth(width) {
    self.containerWidth = width;
  },

  setContainerHeight(height) {
    self.containerHeight = height;
  },

  setStageZoom(zoom) {
    self.stageZoom = zoom;
  },

  setStageZoomX(zoom) {
    self.stageZoomX = zoom;
  },

  setStageZoomY(zoom) {
    self.stageZoomY = zoom;
  },

  setCurrentZoom(zoom) {
    self.currentZoom = zoom;
  },

  setZoomScale(zoomScale) {
    self.zoomScale = zoomScale;
  },

  setZoomingPositionX(x) {
    self.zoomingPositionX = x;
  },

  setZoomingPositionY(y) {
    self.zoomingPositionY = y;
  },

  setBrightnessGrade(grade) {
    self.brightnessGrade = grade;
  },

  setContrastGrade(grade) {
    self.contrastGrade = grade;
  },
}));

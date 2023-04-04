const { I } = inject();

/**
 * @typedef BoundingClientRect
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

module.exports = {
  _rootSelector: '.lsf-video-segmentation',
  _videoRootSelector: '.lsf-video__main',
  _trackSelector: '.lsf-seeker__track',
  _indicatorSelector: '.lsf-seeker__indicator',
  _positionSelector: '.lsf-seeker__position',
  _seekStepForwardSelector: '.lsf-timeline-controls__main-controls > div:nth-child(2) > button:nth-child(4)',
  _seekStepBackwardSelector: '.lsf-timeline-controls__main-controls > div:nth-child(2) > button:nth-child(2)',

  locateVideoContainer() {
    return locate(this._videoRootSelector);
  },

  videoLocate(locator) {
    return locator ? locate(locator).inside(this.locateVideoContainer()) : this.locateVideoContainer();
  },

  /**
   * Grab the bounding rect of the video track
   * @returns {Promise<BoundingClientRect>}
   */
  async grabTrackBoundingRect() {
    return I.grabElementBoundingRect(this._trackSelector);
  },

  /**
   * Grab the bounding rect of the video indicator (the slider that outlines the viewable region)
   * @returns {Promise<BoundingClientRect>}
   */
  async grabIndicatorBoundingRect() {
    return I.grabElementBoundingRect(this._indicatorSelector);
  },

  /**
   * Grab the bounding rect of the video position (the playhead/cursor element).
   * @returns {Promise<BoundingClientRect>}
   */
  async grabPositionBoundingRect() {
    return I.grabElementBoundingRect(this._positionSelector);
  },

  /**
   * Drag the element to the given position
   * @param {BoundingClientRect} bbox
   * @param {number} x
   * @param {number} [y=undefined]
   * @returns {Promise<void>}
   */
  async drag(bbox, x, y) {
    const from = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
    const to = { x, y: y || from.y };

    return I.dragAndDropMouse(from, to);
  },

  /**
   * Seek forward steps
   * @param {number} steps
   * @returns {Promise<void>}
   */
  async clickSeekStepForward(steps = 1) {
    for (let i = 0; i < steps; i++) {
      I.click(this._seekStepForwardSelector);
    }
  },

  /**
   * Seek backward steps
   * @param {number} steps
   * @returns {Promise<void>}
   */
  async clickSeekStepBackward(steps = 1) {
    for (let i = 0; i < steps; i++) {
      I.click(this._seekStepBackwardSelector);
    }
  },
};

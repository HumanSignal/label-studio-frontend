/* global locate */

module.exports = {
  _rootSelector: '.lsf-video-segmentation',
  _videoRootSelector: '.lsf-video__main',
  locateVideoContainer() {
    return locate(this._videoRootSelector);
  },
  videoLocate(locator) {
    return locator ? locate(locator).inside(this.locateVideoContainer()) : this.locateVideoContainer();
  },
};

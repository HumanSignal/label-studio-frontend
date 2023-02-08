import { getParent, types } from 'mobx-state-tree';
import { ImageSelectionPoint } from './ImageSelectionPoint';

export const ImageSelection = types.model({
  start: types.maybeNull(ImageSelectionPoint),
  end: types.maybeNull(ImageSelectionPoint),
}).views(self => {
  return {
    get obj() {
      return getParent(self);
    },
    get annotation() {
      return self.obj.annotation;
    },
    get highlightedNodeExists() {
      return !!self.annotation.highlightedNode;
    },
    get isActive() {
      return self.start && self.end;
    },
    get x() {
      return Math.min((self.start.x * self.scale), (self.end.x * self.scale));
    },
    get y() {
      return Math.min((self.start.y * self.scale), (self.end.y * self.scale));
    },
    get width() {
      return Math.abs((self.end.x * self.scale) - (self.start.x * self.scale));
    },
    get height() {
      return Math.abs((self.end.y * self.scale) - (self.start.y * self.scale));
    },
    get scale() {
      return self.obj.zoomScale;
    },
    get bbox() {
      const { start, end } = self;

      return self.isActive ? {
        left: Math.min(start.x, end.x),
        top: Math.min(start.y, end.y),
        right: Math.max(start.x, end.x),
        bottom: Math.max(start.y, end.y),
      } : null;
    },
    includesBbox(bbox) {
      return self.isActive && bbox && self.bbox.left <= bbox.left && self.bbox.top <= bbox.top && self.bbox.right >= bbox.right && self.bbox.bottom >= bbox.bottom;
    },
    intersectsBbox(bbox) {
      if (!self.isActive || !bbox) return false;
      const selfCenterX = (self.bbox.left + self.bbox.right) / 2;
      const selfCenterY = (self.bbox.top + self.bbox.bottom) / 2;
      const selfWidth = self.bbox.right - self.bbox.left;
      const selfHeight = self.bbox.bottom - self.bbox.top;
      const targetCenterX = (bbox.left + bbox.right) / 2;
      const targetCenterY = (bbox.top + bbox.bottom) / 2;
      const targetWidth = bbox.right - bbox.left;
      const targetHeight = bbox.bottom - bbox.top;

      return (Math.abs(selfCenterX - targetCenterX) * 2 < (selfWidth + targetWidth)) &&
        (Math.abs(selfCenterY - targetCenterY) * 2 < (selfHeight + targetHeight));
    },
    get selectionBorders() {
      return self.isActive || !self.obj.selectedRegions.length ? null : self.obj.selectedRegions.reduce((borders, region) => {
        return region.bboxCoords ? {
          left: Math.min(borders.left, region.bboxCoords.left),
          top: Math.min(borders.top,region.bboxCoords.top),
          right: Math.max(borders.right, region.bboxCoords.right),
          bottom: Math.max(borders.bottom, region.bboxCoords.bottom),
        } : borders;
      }, {
        left: self.obj.stageWidth,
        top: self.obj.stageHeight,
        right: 0,
        bottom: 0,
      });
    },
  };
}).actions(self => {
  return {
    setStart(point) {
      self.start = point;
    },
    setEnd(point) {
      self.end = point;
    },
  };
});

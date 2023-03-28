import { types } from 'mobx-state-tree';
import { FF_DEV_3793, isFF } from '../utils/feature-flags';

export const KonvaRegionMixin = types.model({})
  .views((self) => {
    return {
      get bboxCoords() {
        console.warn('KonvaRegionMixin needs to implement bboxCoords getter in regions');
        return null;
      },
      get bboxCoordsCanvas() {
        const bbox = self.bboxCoords;

        if (!isFF(FF_DEV_3793)) return bbox;

        return {
          left: self.parent.internalToCanvasX(bbox.left),
          top: self.parent.internalToCanvasY(bbox.top),
          right: self.parent.internalToCanvasX(bbox.right),
          bottom: self.parent.internalToCanvasY(bbox.bottom),
        };
      },
      get control() {
        // that's a little bit tricky, but it seems that having a tools field is necessary for the region-creating control tag and it's might be a clue
        return self.results.find(result => result.from_name.tools)?.from_name;
      },
      get canRotate() {
        return self.control?.canrotate && self.supportsRotate;
      },

      get supportsTransform() {
        if (self.isReadOnly()) return false;
        return this._supportsTransform && !this.hidden;
      },
    };
  })
  .actions(self => {
    let deferredSelectId = null;

    return {
      checkSizes() {
        const { naturalWidth, naturalHeight, stageWidth: width, stageHeight: height } = self.parent;

        if (width > 1 && height > 1) {
          self.updateImageSize?.(width / naturalWidth, height / naturalHeight, width, height);
        }
      },

      selectRegion() {
        const canvas = self.shapeRef?.parent?.canvas?._canvas;
        let viewport = canvas;

        // don't scroll when image is zoomed
        if (self.object.zoomScale > 1) return;

        // `.lsf-main-content` is the main scrollable container for LSF
        while (viewport && !viewport.scrollTop && !viewport.className.includes('main-content')) {
          viewport = viewport.parentElement;
        }
        if (!viewport) return;

        // minimum percent of region area to consider it visible
        const VISIBLE_AREA = 0.6;
        // infobar is positioned absolutely, covering part of UI
        const INFOBAR_HEIGHT = 36;

        const vBBox = viewport.getBoundingClientRect();
        const cBBox = canvas.getBoundingClientRect();
        const rBBox = self.bboxCoordsCanvas;
        const height = rBBox.bottom - rBBox.top;
        // comparing the closest point of region from top or bottom image edge
        // and how deep is this edge hidden behind respective edge of viewport
        const overTop = rBBox.top - (vBBox.top - cBBox.top);
        const overBottom = (canvas.clientHeight - rBBox.bottom) - (cBBox.bottom - vBBox.bottom) - INFOBAR_HEIGHT;

        // huge region cut off by viewport edges — do nothing
        if (overTop < 0 && overBottom < 0) return;

        if (overTop < 0 && -overTop / height > (1 - VISIBLE_AREA)) {
          viewport.scrollBy({ top: overTop, left: 0, behavior: 'smooth' });
        } else if (overBottom < 0 && -overBottom / height > (1 - VISIBLE_AREA)) {
          viewport.scrollBy({ top: -overBottom, left: 0, behavior: 'smooth' });
        }
      },

      onClickRegion(e) {
        const annotation = self.annotation;
        const ev = e?.evt || e;
        const additiveMode = ev?.ctrlKey || ev?.metaKey;

        if (e) e.cancelBubble = true;

        const selectAction = () => {
          self._selectArea(additiveMode);
          deferredSelectId = null;
        };

        if (!annotation.isReadOnly() && annotation.relationMode) {
          annotation.addRelation(self);
          annotation.stopRelationMode();
          annotation.regionStore.unselectAll();
        } else {
          // Skip double click emulation when there is nothing to focus
          if (!self.perRegionFocusTarget) {
            selectAction();
            return;
          }
          // Double click emulation
          if (deferredSelectId) {
            clearTimeout(deferredSelectId);
            self.requestPerRegionFocus();
            deferredSelectId = null;
            annotation.selectArea(self);
          } else {
            deferredSelectId = setTimeout(selectAction, 300);
          }
        }
      },
    };
  });

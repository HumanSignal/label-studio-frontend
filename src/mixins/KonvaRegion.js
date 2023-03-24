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

        while (viewport && !viewport.scrollTop && !viewport.className.includes('main-content')) {
          viewport = viewport.parentElement;
        }
        if (!viewport) return;

        const VISIBLE_PIECE = 10;
        const INFOBAR_HEIGHT = 36;

        const vBBox = viewport.getBoundingClientRect();
        const cBBox = canvas.getBoundingClientRect();
        const rBBox = self.bboxCoordsCanvas;
        const overTop = rBBox.bottom - (vBBox.top - cBBox.top);
        const overBottom = (canvas.clientHeight - rBBox.top) - (cBBox.bottom - vBBox.bottom);

        if (overTop < VISIBLE_PIECE) {
          viewport.scrollBy(0, overTop - VISIBLE_PIECE);
        } else if (overBottom < VISIBLE_PIECE + INFOBAR_HEIGHT) {
          viewport.scrollBy(0, -overBottom + VISIBLE_PIECE + INFOBAR_HEIGHT);
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

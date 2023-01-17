import { types } from 'mobx-state-tree';

export const KonvaRegionMixin = types.model({})
  .views((self) => {
    return {
      get bboxCoords() {
        console.warn('KonvaRegionMixin needs to implement bboxCoords getter in regions');
        return null;
      },
      get control() {
        // that's a little bit tricky, but it seems that having a tools field is necessary for the region-creating control tag and it's might be a clue
        return self.results.find(result => result.from_name.tools)?.from_name;
      },
      get canRotate() {
        return self.control?.canrotate && self.supportsRotate;
      },

      get supportsTransform() {
        return this._supportsTransform && this.editable && !this.hidden;
      },
    };
  })
  .actions(self => ({
    // All of the below accept size as an argument
    moveTop() {},
    moveBottom() {},
    moveLeft() {},
    moveRight() {},

    sizeRight() {},
    sizeLeft() {},
    sizeTop() {},
    sizeBottom() {},

    // "web" degree is opposite to mathematical, -90 is 90 actually
    // swapSizes = true when canvas is already rotated at this moment
    // @todo not used
    rotatePoint(point, degree, swapSizes = true) {
      const { x, y } = point;

      if (!degree) return { x, y };

      degree = (360 + degree) % 360;
      // transform origin is (w/2, w/2) for ccw rotation
      // (h/2, h/2) for cw rotation
      const w = self.parent.stageWidth;
      const h = self.parent.stageHeight;
      // actions: translate to fit origin, rotate, translate back
      //   const shift = size / 2;
      //   const newX = (x - shift) * cos + (y - shift) * sin + shift;
      //   const newY = -(x - shift) * sin + (y - shift) * cos + shift;
      // for ortogonal degrees it's simple:

      if (degree === 270) return { x: y, y: (swapSizes ? h : w) - x };
      if (degree === 90) return { x: (swapSizes ? w : h) - y, y: x };
      if (Math.abs(degree) === 180) return { x: w - x, y: h - y };
      return { x, y };
    },

    // @todo not used
    rotateDimensions({ width, height }, degree) {
      if ((degree + 360) % 180 === 0) return { width, height };
      return { width: height, height: width };
    },

    // @todo use methods above
    convertXToPerc(x) {
      return (x * 100) / self.parent.stageWidth;
    },

    convertYToPerc(y) {
      return (y * 100) / self.parent.stageHeight;
    },

    convertHDimensionToPerc(hd) {
      return (hd * (self.scaleX || 1) * 100) / self.parent.stageWidth;
    },

    convertVDimensionToPerc(vd) {
      return (vd * (self.scaleY || 1) * 100) / self.parent.stageHeight;
    },
  }))
  .actions(self => {
    let deferredSelectId = null;

    return {
      checkSizes() {
        const { naturalWidth, naturalHeight, stageWidth: width, stageHeight: height } = self.parent;

        if (width>1 && height>1) {
          self.updateImageSize?.(width / naturalWidth, height / naturalHeight, width, height);
        }
      },
      onClickRegion(e) {
        const annotation = self.annotation;
        const ev = e?.evt || e;
        const additiveMode = ev?.ctrlKey || ev?.metaKey;

        if (e) e.cancelBubble = true;

        if (annotation.editable && annotation.relationMode) {
          annotation.addRelation(self);
          annotation.stopRelationMode();
          annotation.regionStore.unselectAll();
        } else {
          if (deferredSelectId) {
            clearTimeout(deferredSelectId);
            self.requestPerRegionFocus();
            deferredSelectId = null;
            annotation.selectArea(self);
          } else {
            deferredSelectId = setTimeout(() => {
              self._selectArea(additiveMode);
              deferredSelectId = null;
            }, 300);
          }
        }
      },
    };
  });

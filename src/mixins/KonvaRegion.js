import { types } from "mobx-state-tree";

export const KonvaRegionMixin = types.model({})
  .views(() => {
    return {
      get bboxCoords() {
        console.warn("KonvaRegionMixin needs to implement bboxCoords getter in regions");
        return null;
      },
    };
  })
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

        if (!annotation.editable || self.isDrawing) return;
        if (e) e.cancelBubble = true;

        if (annotation.relationMode) {
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
              self._selectArea();
              deferredSelectId = null;
            }, 300);
          }
        }
      },
    };
  });
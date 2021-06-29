import { types } from "mobx-state-tree";

export const KonvaRegionMixin = types.model({}).actions(self => {
  let deferredSelectId = null;
  return {
    onClickRegion(e) {
      const annotation = self.annotation;
      if (!annotation.editable || self.isDrawing) return;
      e.cancelBubble = true;

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
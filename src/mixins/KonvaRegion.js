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
  .actions(self => {
    let deferredSelectId = null;

    return {
      checkSizes() {
        const { naturalWidth, naturalHeight, stageWidth: width, stageHeight: height } = self.parent;

        if (width > 1 && height > 1) {
          self.updateImageSize?.(width / naturalWidth, height / naturalHeight, width, height);
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

        if (annotation.editable && annotation.relationMode) {
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

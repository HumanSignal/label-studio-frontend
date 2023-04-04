import { getEnv, getParent, getRoot, getType, types } from 'mobx-state-tree';
import { guidGenerator } from '../core/Helpers';
import { isDefined } from '../utils/utilities';
import { AnnotationMixin } from './AnnotationMixin';
import { ReadOnlyRegionMixin } from './ReadOnlyMixin';

const RegionsMixin = types
  .model({
    // id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

    score: types.maybeNull(types.number),

    hidden: types.optional(types.boolean, false),

    parentID: types.optional(types.string, ''),

    fromSuggestion: false,

    // Dynamic preannotations enabled
    dynamic: false,

    locked: false,

    origin: types.optional(types.enumeration([
      'prediction',
      'prediction-changed',
      'manual',
    ]), 'manual'),

    item_index: types.maybeNull(types.number),
  })
  .volatile(() => ({
    // selected: false,
    _highlighted: false,
    isDrawing: false,
    perRegionFocusRequest: null,
    shapeRef: null,
    drawingTimeout: null,
  }))
  .views(self => ({
    get perRegionStates() {
      const states = self.states;

      return states && states.filter(s => s.perregion === true);
    },

    get store() {
      return getRoot(self);
    },

    get parent() {
      return getParent(self);
    },

    get editable() {
      throw new Error('Not implemented');
    },

    get isCompleted() {
      return !self.isDrawing;
    },

    get highlighted() {
      return self._highlighted;
    },

    get inSelection() {
      return self.annotation?.regionStore.isSelected(self);
    },

    get isReady() {
      return true;
    },

    get currentImageEntity() {
      return self.parent.findImageEntity(self.item_index ?? 0);
    },

    getConnectedDynamicRegions(selfExcluding) {
      const { regions = [] } = getRoot(self).annotationStore?.selected || {};

      return regions.filter(r => {
        if (selfExcluding && r === self) return false;
        return r.dynamic && r.type === self.type && r.labelName === self.labelName;
      });
    },

  }))
  .actions(self => {
    return {
      setParentID(id) {
        self.parentID = id;
      },

      setDrawing(val) {
        self.isDrawing = val;
      },

      setShapeRef(ref) {
        if (!ref) return;
        self.shapeRef = ref;
      },

      setItemIndex(index) {
        if (!isDefined(index)) throw new Error('Index must be provided for', self);
        self.item_index = index;
      },

      beforeDestroy() {
        self.notifyDrawingFinished({ destroy: true });
      },

      setLocked(locked) {
        if (locked instanceof Function) {
          self.locked = locked(self.locked);
        } else {
          self.locked = locked;
        }
      },

      makeDynamic() {
        self.dynamic = true;
      },

      // @todo this conversion methods should be removed after removing FF_DEV_3793
      convertXToPerc(x) {
        return (x * 100) / self.currentImageEntity.stageWidth;
      },

      convertYToPerc(y) {
        return (y * 100) / self.currentImageEntity.stageHeight;
      },

      convertHDimensionToPerc(hd) {
        return (hd * (self.scaleX || 1) * 100) / self.currentImageEntity.stageWidth;
      },

      convertVDimensionToPerc(vd) {
        return (vd * (self.scaleY || 1) * 100) / self.currentImageEntity.stageHeight;
      },

      // update region appearence based on it's current states, for
      // example bbox needs to update its colors when you change the
      // label, becuase it takes color from the label
      updateAppearenceFromState() {},

      serialize() {
        console.error('Region class needs to implement serialize');
      },

      selectRegion() {},

      /**
     * @todo fix "keep selected" setting
     * Common logic for unselection; specific actions should be in `afterUnselectRegion`
     * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
     */
      unselectRegion(tryToKeepStates = false) {
        console.log('UNSELECT REGION', 'you should not be here');
        // eslint-disable-next-line no-constant-condition
        if (1) return;
        const annotation = self.annotation;
        const parent = self.parent;
        const keepStates = tryToKeepStates && self.store.settings.continuousLabeling;

        if (annotation.relationMode) {
          annotation.stopRelationMode();
        }
        if (parent.setSelected) {
          parent.setSelected(undefined);
        }

        self.selected = false;
        annotation.setHighlightedNode(null);

        self.afterUnselectRegion();

        if (!keepStates) {
          annotation.unloadRegionState(self);
        }
      },

      afterUnselectRegion() {},

      onClickRegion(ev) {
        const annotation = self.annotation;

        if (!self.isReadOnly() && (self.isDrawing || annotation.isDrawing)) return;

        if (!self.isReadOnly() && annotation.relationMode) {
          annotation.addRelation(self);
          annotation.stopRelationMode();
          annotation.regionStore.unselectAll();
        } else {
          self._selectArea(ev?.ctrlKey || ev?.metaKey);
        }
      },

      _selectArea(additiveMode = false) {
        this.cancelPerRegionFocus();
        const annotation = self.annotation;

        if (additiveMode) {
          annotation.toggleRegionSelection(self);
        } else {
          const wasNotSelected = !self.selected;

          if (wasNotSelected) {
            annotation.selectArea(self);
          } else {
            annotation.unselectAll();
          }
        }
      },

      requestPerRegionFocus() {
        self.perRegionFocusRequest = Date.now();
      },

      cancelPerRegionFocus() {
        self.perRegionFocusRequest = null;
      },

      setHighlight(val) {
        self._highlighted = val;
      },

      toggleHighlight() {
        self.setHighlight(!self._highlighted);
      },

      toggleHidden(e) {
        self.hidden = !self.hidden;
        e && e.stopPropagation();
      },

      notifyDrawingFinished({ destroy = false } = {}) {
        if (self.origin === 'prediction') {
          self.origin = 'prediction-changed';
        }

        // everything above is related to dynamic preannotations
        if (!self.dynamic || self.fromSuggestion) return;

        clearTimeout(self.drawingTimeout);

        if (self.isDrawing === false) {
          const timeout = getType(self).name.match(/brush/i) ? 1200 : 0;
          const env = getEnv(self);

          self.drawingTimeout = setTimeout(() => {
            env.events.invoke('regionFinishedDrawing', self, self.getConnectedDynamicRegions(destroy));
          }, timeout);
        }
      },
    };
  });

export default types.compose(RegionsMixin, ReadOnlyRegionMixin, AnnotationMixin);

import { types } from "mobx-state-tree";
import isMatch from "lodash.ismatch";
import InfoModal from "../../components/Infomodal/Infomodal";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";

const ObjectBase = types
  .model({
    // TODO there should be a better way to force an update
    _needsUpdate: types.optional(types.number, 0),
  })
  .volatile(() => {
    return {
      isReady: true,
    };
  })
  .views(self => ({
    findRegion(params) {
      let obj = null;

      if (self._regionsCache && self._regionsCache.length) {
        obj = self._regionsCache.find(({ region }) => isMatch(region, params));
      }

      return obj || self.regions.find(r => isMatch(r, params));
    },
  }))
  .actions(self => ({
    toStateJSON() {
      if (!self.regions) return;

      const objectsToReturn = self.regions.map(r => r.toStateJSON());

      return objectsToReturn;
    },
    setReady(value) {
      self.isReady = value;
    },
  }))
  .actions(self => {
    let props = {};

    function addProp(name, value) {
      props[name] = value;
      self._needsUpdate = self._needsUpdate + 1;
    }

    function getProps() {
      return props;
    }

    // @todo maybe not a best place for this method?
    // check that maxUsages was not exceeded for labels
    // and if it was - don't allow to create new region and unselect all regions
    // unselect labels which was exceeded maxUsages
    // return all states left untouched - available labels and others
    function getAvailableStates() {
      // `checkMaxUsages` may unselect labels with already reached `maxUsages`
      const checkAndCollect = (list, s) => (s.checkMaxUsages ? list.concat(s.checkMaxUsages()) : list);
      const allStates = self.states() || [];
      const exceeded = allStates.reduce(checkAndCollect, []);
      const states = self.activeStates() || [];

      if (states.length === 0) {
        if (exceeded.length) {
          const label = exceeded[0];

          InfoModal.warning(`You can't use ${label.value} more than ${label.maxUsages} time(s)`);
        }
        self.annotation.unselectAll();
      }
      return states;
    }

    return {
      addProp,
      getProps,
      getAvailableStates,
    };
  });

export default types.compose(ObjectBase, AnnotationMixin);

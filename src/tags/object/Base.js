import { types } from "mobx-state-tree";
import lodash from "../../utils/lodash";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";

const ObjectBase = types
  .model({
    // TODO there should be a better way to force an update
    _needsUpdate: types.optional(types.number, 0),
  })
  .views(self => ({
    findRegion(params) {
      return self.regions.find(r => lodash.isMatch(r, params));
    },
  }))
  .actions(self => ({
    toStateJSON() {
      if (!self.regions) return;

      const objectsToReturn = self.regions.map(r => r.toStateJSON());
      return objectsToReturn;
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

    return {
      addProp,
      getProps,
    };
  });

export default ObjectBase;

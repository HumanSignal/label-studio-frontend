import { types } from "mobx-state-tree";

const ValidateMixin = types.model().actions(self => ({
  validate() {
    if (self.perregion == true) {
      // validating when choices labeling is done per region,
      // for example choice may be required to be selected for
      // every bbox
      const objectTag = self.completion.names.get(self.toname);

      for (var i = 0; i < objectTag.regions.length; i++) {
        const reg = objectTag.regions[i];
        const s = reg.states.find(s => s.type === self.type);

        if (!s || s.getSelectedNames().length === 0) {
          self.completion.regionStore.unselectAll();
          reg.selectRegion();
          self.requiredModal();

          return false;
        }
      }
    } else {
      // validation when its classifying the whole object
      if (self.getSelectedNames().length === 0) {
        self.requiredModal();
        return false;
      }
    }

    return true;
  },
}));

export default ValidateMixin;

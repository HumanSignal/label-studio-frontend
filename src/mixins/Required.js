import { types } from "mobx-state-tree";

const RequiredMixin = types
  .model({
    required: types.optional(types.boolean, false),
    requiredmessage: types.maybeNull(types.string),
  })
  .actions(self => ({
    validate() {
      if (self.perregion == true) {
        // validating when choices labeling is done per region,
        // for example choice may be required to be selected for
        // every bbox
        const objectTag = self.completion.names.get(self.toname);

        for (var i = 0; i < objectTag.regions.length; i++) {
          const reg = objectTag.regions[i];
          const s = reg.states.find(s => s.type === self.type);

          if (self.whenlabelvalue && !reg.hasLabelState(self.whenlabelvalue)) {
            return true;
          }

          if (!s || s.selectedValues().length === 0) {
            // means that this element is not visible because its
            // not matching the label value, means we don't need to validation

            self.completion.regionStore.unselectAll();
            reg.selectRegion();
            self.requiredModal();

            return false;
          }
        }
      } else {
        // validation when its classifying the whole object
        if (self.selectedValues().length === 0) {
          self.requiredModal();
          return false;
        }
      }

      return true;
    },
  }));

export default RequiredMixin;

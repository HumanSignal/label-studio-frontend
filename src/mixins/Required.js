import { getParent, types } from "mobx-state-tree";

const RequiredMixin = types
  .model({
    required: types.optional(types.boolean, false),
    requiredmessage: types.maybeNull(types.string),
  })
  .actions(self => ({
    validate() {
      if (self.perregion) {
        // validating when choices labeling is done per region,
        // for example choice may be required to be selected for
        // every bbox
        const objectTag = self.annotation.names.get(self.toname);

        for (const reg of objectTag.regs) {
          const s = reg.results.find(s => s.from_name === self);

          if (self.whenlabelvalue && !reg.hasLabel(self.whenlabelvalue)) {
            continue;
          }

          if (!s?.hasValue) {
            self.annotation.selectArea(reg);
            self.requiredModal();

            return false;
          }
        }
      } else {
        // validation when its classifying the whole object
        // isVisible can be undefined (so comparison is true) or boolean (so check for visibility)
        if (!self.holdsState && self.isVisible !== false && getParent(self, 2)?.isVisible !== false) {
          self.requiredModal();
          return false;
        }
      }

      return true;
    },
  }));

export default RequiredMixin;

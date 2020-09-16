import { types } from "mobx-state-tree";

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
        const objectTag = self.completion.names.get(self.toname);

        for (let reg of objectTag.regs) {
          const s = reg.results.find(s => s.type === self.resultType);

          if (self.whenlabelvalue && !reg.hasLabel(self.whenlabelvalue)) {
            return true;
          }

          if (!s?.hasValue) {
            self.completion.selectArea(reg);
            self.requiredModal();

            return false;
          }
        }
      } else {
        // validation when its classifying the whole object
        if (!self.holdsState) {
          self.requiredModal();
          return false;
        }
      }

      return true;
    },
  }));

export default RequiredMixin;

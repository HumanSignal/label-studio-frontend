import { types } from "mobx-state-tree";

const ControlBase = types
  .model({})
  .views(self => ({
    get serializableValue() {
      const obj = {};
      if (self.selectedValues) {
        obj[self.type] = self.selectedValues();
      }

      return obj;
    },
  }))
  .actions(self => ({}));

export default ControlBase;

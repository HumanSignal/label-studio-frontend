import { types } from "mobx-state-tree";
import lodash from "../../utils/lodash";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";

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

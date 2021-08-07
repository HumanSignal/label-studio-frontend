import { types } from "mobx-state-tree";

import { parseValue } from "../utils/data";

const ProcessAttrsMixin = types.model().actions(self => ({
  updateLocalValue (value) {
    self._value = value;
  },

  updateValue (store) {
    self._value = parseValue(self.value, store.task.dataObj);
  },
}));

export default ProcessAttrsMixin;

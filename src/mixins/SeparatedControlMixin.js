import { types } from "mobx-state-tree";

const SeparatedControlMixin = types.model().views(self => ({
  get obj() {
    return self.annotation.names.get(self.toname);
  },

  get selectedLabels() {
    return [];
  },
  selectedValues() {
    return [];
  },
  getResultValue() {
    return {};
  },
}));

export default SeparatedControlMixin;

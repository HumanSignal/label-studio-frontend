import { types } from "mobx-state-tree";

import Tree from "../core/Tree";

const SelectedModelMixin = types
  .model()
  .views(self => ({
    get tiedChildren() {
      console.log(Tree.filterChildrenOfType(self, self._child));
      return Tree.filterChildrenOfType(self, self._child);
    },

    get selectedLabels() {
      return self.tiedChildren.filter(c => c.selected === true);
    },

    get isSelected() {
      return self.selectedLabels.length > 0;
    },

    // right now this is duplicate code from the above and it's done for clarity
    get holdsState() {
      return self.selectedLabels.length > 0;
    },
  }))
  .actions(self => ({
    /**
     * Get current color from Label settings
     */
    getSelectedColor() {
      // return first selected label color
      const sel = self.tiedChildren.find(c => c.selected === true);
      return sel && sel.background;
    },

    findLabel(value) {
      return self.tiedChildren.find(c => c.alias === value || c.value === value);
    },

    unselectAll() {
      self.tiedChildren.forEach(c => c.setSelected(false));
    },

    getSelectedNames() {
      return self.selectedLabels.map(c => (c.alias ? c.alias : c.value));
    },

    getSelectedString(joinstr) {
      joinstr = joinstr || " ";
      return self.getSelectedNames().join(joinstr);
    },
  }));

export default SelectedModelMixin;

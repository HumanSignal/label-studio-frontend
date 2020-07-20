import { types } from "mobx-state-tree";

import Tree from "../core/Tree";

const SelectedGraphModelMixin = types
  .model()
  .views(self => ({
    get tiedChildren() {
      return Tree.filterChildrenOfType(self, [self._vertex, self._edge]);
    },

    get selectedLabels() {
      return self.tiedChildren.filter(c => c.selected === true);
    },

    getSelectedColor() {
      // return first selected label color
      const sel = self.tiedChildren.find(c => c.selected === true);
      return sel && sel.background;
    },

    getSelectedValue() {
      // return first value
      return self.value;
    },

    get isSelected() {
      return self.selectedLabels.length > 0;
    },

    // right now this is duplicate code from the above and it's done for clarity
    get holdsState() {
      return self.selectedLabels.length > 0;
    },

    selectedValues() {
      return self.selectedLabels.map(c => (c.alias ? c.alias : c.value));
    },

    getSelectedString(joinstr = " ") {
      return self.selectedValues().join(joinstr);
    },

    findLabel(value) {
      return self.tiedChildren.find(c => c.alias === value || c.value === value);
    },
  }))
  .actions(self => ({
    /**
     * Get current color from Label settings
     */
    unselectAll() {
      self.tiedChildren.forEach(c => c.setSelected(false));
    },

    checkMaxUsages() {
      const list = self.tiedChildren.filter(c => !c.canBeUsed());
      if (list.length) list.forEach(c => c.setSelected(false));
      return list;
    },

    selectFirstVisible() {
      const f = self.tiedChildren.find(c => c.visible);
      f && f.toggleSelected();

      return f;
    },
  }));

export default SelectedGraphModelMixin;

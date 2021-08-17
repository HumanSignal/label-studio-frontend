import { getRoot, types } from "mobx-state-tree";

export const AnnotationMixin = types.model("AnnotationMixin", {

}).views((self) => ({
  get annotation() {
    const as = self.annotationStore;

    return as.selectedHistory ?? as.selected;
  },

  get annotationStore() {
    const root = getRoot(self);

    if (root === self) {
      return getRoot(self.control).annotationStore;
    }

    return root.annotationStore;
  },
}));

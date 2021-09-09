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
      if (self.control) {
        return getRoot(self.control).annotationStore;
      } else if (self.obj) {
        return getRoot(self.obj).annotationStore;
      }
    }

    return root.annotationStore;
  },
}));

import { getRoot, types } from "mobx-state-tree";
import { isDefined } from "../utils/utilities";

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
  }
}));

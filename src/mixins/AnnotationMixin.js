import { getRoot, types } from "mobx-state-tree";
import Types from "../core/Types";

export const AnnotationMixin = types.model("AnnotationMixin", {

}).views((self) => ({
  get annotation() {
    return Types.getParentOfTypeString(self, "Annotation");
  },

  get annotationStore() {
    const root = getRoot(self);

    if (root === self) {
      if (self.control) {
        return getRoot(self.control).annotationStore;
      } else if (self.obj) {
        return getRoot(self.obj).annotationStore;
      }
      return null;
    }

    return root.annotationStore;
  },
}));

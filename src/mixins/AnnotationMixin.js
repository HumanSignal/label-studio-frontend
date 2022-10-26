import { getRoot, types } from "mobx-state-tree";
import Types from "../core/Types";
import { FF_DEV_3391, isFF } from "../utils/feature-flags";

export const AnnotationMixin = types.model("AnnotationMixin", {

}).views((self) => ({
  get annotation() {
    if (isFF(FF_DEV_3391)) {
      return Types.getParentOfTypeString(self, "Annotation");
    }

    const as = self.annotationStore;

    return as?.selectedHistory ?? as?.selected;
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

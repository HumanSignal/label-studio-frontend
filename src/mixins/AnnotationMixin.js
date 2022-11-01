import { getRoot, types } from "mobx-state-tree";
import Types from "../core/Types";
import { FF_DEV_3391, isFF } from "../utils/feature-flags";

export const AnnotationMixin = types.model("AnnotationMixin", {

}).views((self) => ({
  get annotation() {
    const root = getRoot(self);

    // if that's a Tool (they live in separate tree)
    if (root === self) {
      if (self.control) {
        return self.control.annotation;
      } else if (self.obj) {
        return self.obj.annotation;
      }
      return null;
    }

    // if annotation history item selected
    if (root.annotationStore?.selectedHistory) {
      return root.annotationStore.selectedHistory;
    }

    // return connected annotation, not the globally selected one
    if (isFF(FF_DEV_3391)) {
      return Types.getParentOfTypeString(self, "Annotation");
    }

    return root.annotationStore?.selected;
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

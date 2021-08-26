import { types } from "mobx-state-tree";

import Types from "../core/Types";

export const AnnotationMixin = types.model("AnnotationMixin", {

}).views((self) => ({
  get annotation() {
    const as = self.annotationStore;

    return as.selectedHistory ?? as.selected;
  },

  get annotationStore() {
    return Types.getParentOfTypeString(self, "AnnotationStore");
  },
}));

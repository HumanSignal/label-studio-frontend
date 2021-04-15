import { getRoot, types } from "mobx-state-tree";

export const AnnotationMixin = types.model("AnnotationMixin", {

}).views((self) => ({
  get annotation() {
    const as = getRoot(self).annotationStore;
    console.log({h: as.selectedHistory, an: as.selected});
    return as.selectedHistory ?? as.selected;
  }
}));

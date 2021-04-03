import { observer } from "mobx-react";
import { CurrentAnnotation } from "../CurrentAnnotation/CurrentAnnotation";
import SideColumn from "../SideColumn/SideColumn";

export const AnnotationTab = observer(({ store }) => {
  const as = store.annotationStore;
  return (
    <>
      <CurrentAnnotation annotation={store.annotationStore.selected} />
      {store.hasInterface("side-column") && !as.viewingAllAnnotations && !as.viewingAllPredictions && (
        <SideColumn store={store} />
      )}
    </>
  );
});

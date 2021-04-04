import { observer } from "mobx-react";
import { CurrentAnnotation } from "../CurrentAnnotation/CurrentAnnotation";
import SideColumn from "../SideColumn/SideColumn";

export const AnnotationTab = observer(({ store }) => {
  const as = store.annotationStore;
  return (
    <>
      <CurrentAnnotation annotation={as.selected} />
      <SideColumn store={store} />
    </>
  );
});

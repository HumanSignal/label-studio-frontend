import { observer } from "mobx-react";
import { CurrentAnnotation } from "../CurrentAnnotation/CurrentAnnotation";
import Entities from "../Entities/Entities";
import Entity from "../Entity/Entity";
import Relations from "../Relations/Relations";

export const AnnotationTab = observer(({ store }) => {
  const as = store.annotationStore;
  const annotation = as.selectedHistory ?? as.selected;
  const node = annotation.highlightedNode;

  return (
    <>
      {store.hasInterface("annotations:current") && (
        <CurrentAnnotation
          annotation={as.selected}
          showControls={store.hasInterface("controls")}
          canDelete={store.hasInterface("annotations:delete")}
          showHistory={store.hasInterface("annotations:history")}
        />
      )}

      {node ? (
        <Entity store={store} annotation={annotation} />
      ) : (
        <p style={{ marginTop: 12, marginBottom: 0, paddingInline: 15}}>Nothing selected</p>
      )}

      <Entities store={store} regionStore={annotation.regionStore} />

      <Relations store={store} item={annotation} />
    </>
  );
});

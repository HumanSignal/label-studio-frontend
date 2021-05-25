import { observer } from "mobx-react";
import { CurrentEntity } from "../CurrentEntity/CurrentEntity";
import Entities from "../Entities/Entities";
import Entity from "../Entity/Entity";
import Relations from "../Relations/Relations";

export const AnnotationTab = observer(({ store }) => {
  const as = store.annotationStore;
  const annotation = as.selectedHistory ?? as.selected;
  const node = annotation.highlightedNode;
  const hasSegmentation = store.hasSegmentation;

  return (
    <>
      {store.hasInterface("annotations:current") && (
        <CurrentEntity
          entity={as.selected}
          showControls={store.hasInterface("controls")}
          canDelete={store.hasInterface("annotations:delete")}
          showHistory={store.hasInterface("annotations:history")}
          showGroundTruth={store.hasInterface("ground-truth")}
        />
      )}

      {node ? (
        <Entity store={store} annotation={annotation} />
      ) : hasSegmentation ? (
        <p style={{ marginTop: 12, marginBottom: 0, paddingInline: 15}}>
          No Region selected
        </p>
      ) : null}

      {hasSegmentation && (
        <Entities store={store} regionStore={annotation.regionStore} />
      )}

      {hasSegmentation && (
        <Relations store={store} item={annotation} />
      )}
    </>
  );
});

import { observer } from "mobx-react";
import { CurrentEntity } from "../CurrentEntity/CurrentEntity";
import Entities from "../Entities/Entities";
import Entity from "../Entity/Entity";
import Relations from "../Relations/Relations";
import { DynamicPreannotationsToggle } from "./DynamicPreannotationsToggle";

export const AnnotationTab = observer(({ store }) => {
  const as = store.annotationStore;
  const annotation = as.selectedHistory ?? as.selected;
  const { selectionSize } = annotation || {};
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

      {selectionSize ? (
        <Entity store={store} annotation={annotation} />
      ) : hasSegmentation ? (
        <p style={{ marginTop: 12, marginBottom: 0, paddingInline: 15 }}>
          No Region selected
        </p>
      ) : null}

      {hasSegmentation && (
        <Entities
          store={store}
          annotation={annotation}
          regionStore={annotation.regionStore}
        />
      )}

      {hasSegmentation && (
        <Relations store={store} item={annotation} />
      )}
    </>
  );
});

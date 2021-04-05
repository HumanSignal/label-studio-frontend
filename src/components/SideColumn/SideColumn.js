import React from "react";
import { observer } from "mobx-react";

import Entities from "../Entities/Entities";
import Entity from "../Entity/Entity";
import Relations from "../Relations/Relations";

/**
 * Component Side with:
 * Annotations
 * Entities
 * Relations
 */
export default observer(({ store }) => {
  const annotation = store.annotationStore.selected;
  const node = annotation.highlightedNode;

  return (
    <>
      {node ? (
        <Entity store={store} annotation={annotation} />
      ) : (
        <p style={{ marginBottom: 0, paddingInline: 15}}>Nothing selected</p>
      )}

      <Entities store={store} regionStore={annotation.regionStore} />

      <Relations store={store} item={annotation} />
    </>
  );
});

import React, { useCallback } from "react";
import { observer } from "mobx-react";
import styles from "./AnnotationTabs.module.scss";
import { PlusOutlined } from "@ant-design/icons";

const Annotation = observer(({ annotation, selected, onClick }) => {
  const classList = [styles.annotation];
  if (selected) classList.push(styles.selected);

  return (
    <div
      className={classList.join(" ")}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onClick(annotation);
      }}
    >
      ID {annotation.id}
    </div>
  );
});

export const AnnotationTabs = observer(({ store }) => {
  const { annotationStore: as } = store;
  const annotations = as.annotations;
  const onAnnotationSelect = useCallback(
    annotation => {
      if (!annotation.selected) {
        as.selectAnnotation(annotation.id);
      }
    },
    [as],
  );

  const onCreateAnnotation = useCallback(() => {
    const c = as.addAnnotation({ userGenerate: true });
    as.selectAnnotation(c.id);
  }, [as]);

  return (
    <div className={styles.wrapper}>
      {annotations.map(annotation => (
        <Annotation
          key={annotation.id}
          annotation={annotation}
          selected={annotation.selected}
          onClick={onAnnotationSelect}
        />
      ))}
      <button className={styles["add-annotation"]} onClick={onCreateAnnotation}>
        <PlusOutlined />
      </button>
    </div>
  );
});

import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { Userpic } from "../../common/Userpic/Userpic";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import "./AnnotationTabs.styl";
import { LsPlus } from "../../assets/icons";

const Annotation = observer(({ annotation, selected, onClick }) => {
  const isUnsaved = annotation.userGenerate && !annotation.sentUserGenerate;

  return (
    <Elem
      name="item"
      mod={{selected}}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onClick(annotation);
      }}
    >
      <Space size="small">
        <Elem name="userpic" tag={Userpic} user={{email: annotation.createdBy}} />
        ID {annotation.id} {isUnsaved && "*"}
      </Space>
    </Elem>
  );
});

export const AnnotationTabs = observer(({
  store,
  showAnnotations = true,
  showPredictions = true,
  allowCreateNew = true,
}) => {
  const { annotationStore: as } = store;
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

  const visible = showAnnotations || showPredictions;

  return visible ? (
    <Block name="annotation-tabs">
      {showPredictions && as.predictions.map(annotation => (
        <Annotation
          key={annotation.id}
          annotation={annotation}
          selected={annotation.selected}
          onClick={onAnnotationSelect}
          prediction={true}
        />
      ))}

      {showAnnotations && as.annotations.map(annotation => (
        <Annotation
          key={annotation.id}
          annotation={annotation}
          selected={annotation.selected}
          onClick={onAnnotationSelect}
        />
      ))}

      {allowCreateNew && (
        <Elem tag="button" name="add" onClick={onCreateAnnotation}>
          <LsPlus/>
        </Elem>
      )}
    </Block>
  ) : null;
});

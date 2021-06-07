import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { Userpic } from "../../common/Userpic/Userpic";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import "./AnnotationTabs.styl";
import { LsGrid, LsPlus, LsSparks, LsStar } from "../../assets/icons";

export const EntityTab = observer(forwardRef(({
  entity,
  selected,
  style,
  onClick,
  bordered = true,
  prediction = false,
  displayGroundTruth = false,
}, ref) => {
  const isUnsaved = (entity.userGenerate && !entity.sentUserGenerate) || entity.draftSelected;

  return (
    <Block
      name="entity-tab"
      ref={ref}
      mod={{selected, bordered}}
      style={style}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(entity, prediction);
      }}
    >
      <Space size="small">
        <Elem
          name="userpic"
          tag={Userpic}
          username={prediction ? entity.createdBy : null}
          showUsername={prediction}
          user={entity.user ?? {email: entity.createdBy}}
          mod={{prediction}}
        >{prediction && <LsSparks/>}</Elem>

        <Elem name="identifier">
          ID {entity.pk ?? entity.id} {isUnsaved && "*"}
        </Elem>

        {displayGroundTruth && entity.ground_truth && (
          <Elem name="ground-truth" tag={LsStar}/>
        )}
      </Space>
    </Block>
  );
}));

export const AnnotationTabs = observer(({
  store,
  showAnnotations = true,
  showPredictions = true,
  allowCreateNew = true,
  allowViewAll = true,
}) => {
  const listRef = useRef();
  const selectedRef = useRef();

  const { annotationStore: as } = store;
  const onAnnotationSelect = useCallback((entity, isPrediction) => {
    if (!entity.selected) {
      if (isPrediction) {
        as.selectPrediction(entity.id);
      } else {
        as.selectAnnotation(entity.id);
      }
    }
  }, [as],);

  const onCreateAnnotation = useCallback(() => {
    const c = as.addAnnotation({ userGenerate: true });
    as.selectAnnotation(c.id);
  }, [as]);

  const onToggleVisibility = useCallback(() => {
    as.toggleViewingAllAnnotations();
  }, [as]);

  const visible = showAnnotations || showPredictions;

  const list = [];

  if (showPredictions) list.push(...as.predictions);
  if (showAnnotations) list.push(...as.annotations);

  useEffect(() => {
    if (selectedRef.current) {
      const list = listRef.current;
      const elem = selectedRef.current;
      const xOffset = elem.offsetLeft + (elem.clientWidth / 2) - (list.clientWidth / 2);

      list.scrollTo({
        left: xOffset,
        behavior: "smooth",
      });
    }
  }, [store.annotationStore.selected, selectedRef, listRef]);

  return visible ? (
    <Block
      name="annotation-tabs"
      mod={{ viewAll: allowViewAll, addNew: allowCreateNew }}
      onMouseDown={e => e.stopPropagation()}
    >

      {allowCreateNew && (
        <Elem tag="button" name="add" onClick={onCreateAnnotation}>
          <LsPlus/>
        </Elem>
      )}

      <Elem name="list" ref={listRef}>
        {list.map(entity => (
          <EntityTab
            key={entity.id}
            entity={entity}
            selected={entity.selected}
            onClick={onAnnotationSelect}
            displayGroundTruth={store.hasInterface("ground-truth")}
            prediction={entity.type === 'prediction'}
            ref={entity.selected ? selectedRef : undefined}
          />
        ))}
      </Elem>

      {allowViewAll && (
        <Elem tag="button" name="all" mod={{active: as.viewingAll}} onClick={onToggleVisibility}>
          <LsGrid/>
        </Elem>
      )}
    </Block>
  ) : null;
});

import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconPlusCircle, LsSparks } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import { isDefined, userDisplayName } from "../../utils/utilities";
import "./Annotations.styl";

export const Annotations = observer(({ store, annotationStore }) => {
  const dropdownRef = useRef();
  const [opened, setOpened] = useState(false);

  const entities = [
    ...annotationStore.predictions,
    ...annotationStore.annotations,
  ];

  const onAnnotationSelect = useCallback((entity, isPrediction) => {
    if (!entity.selected) {
      if (isPrediction) {
        annotationStore.selectPrediction(entity.id);
      } else {
        annotationStore.selectAnnotation(entity.id);
      }
    }
  }, [annotationStore]);

  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target;
      const dropdown = dropdownRef.current;

      if (target !== dropdown && !dropdown.contains(target)) {
        setOpened(false);
      }
    };

    document.addEventListener('click', handleClick);

    return () => document.removeEventListener('click', handleClick);
  }, []);


  return (
    <Elem name="section" mod={{ flat: true }}>
      <Block name="annotations-list" ref={dropdownRef}>
        <Elem name="selected">
          <Annotation
            aria-label="Annotations List Toggle"
            entity={annotationStore.selected}
            onClick={(e) => {
              e.stopPropagation();
              setOpened(!opened);
            }}
            extra={(
              <Space size="none" style={{ marginRight: -8 }}>
                <Elem name="counter">
                  {entities.indexOf(annotationStore.selected) + 1}/{entities.length}
                </Elem>
                <Elem name="toggle" mod={{ opened }}/>
              </Space>
            )}
          />
        </Elem>

        {opened && (
          <Elem name="list">
            {store.hasInterface('annotations:add-new') && (
              <CreateAnnotation
                annotationStore={annotationStore}
                onClick={() => setOpened(false)}
              />
            )}

            {entities.map((ent, i) => (
              <Annotation
                key={`${ent.pk ?? ent.id}${ent.type}`}
                entity={ent}
                aria-label={`${ent.type} ${i + 1}`}
                selected={ent === annotationStore.selected}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpened(false);
                  onAnnotationSelect?.(ent, ent.type === 'prediction');
                }}
              />
            ))}
          </Elem>
        )}
      </Block>
    </Elem>
  );
});

const CreateAnnotation = observer(({ annotationStore, onClick }) => {
  const onCreateAnnotation = useCallback(() => {
    const c = annotationStore.addAnnotation({ userGenerate: true });

    annotationStore.selectAnnotation(c.id);
    onClick();
  }, [annotationStore, onClick]);

  return (
    <Elem name="create" aria-label="Create Annotation" onClick={onCreateAnnotation}>
      <Space size="small">
        <Elem name="userpic" tag={Userpic} mod={{ prediction: true }}>
          <IconPlusCircle/>
        </Elem>
        Create Annotation
      </Space>
    </Elem>
  );
});

const Annotation = observer(({ entity, selected, onClick, extra, ...props }) => {
  const isPrediction = entity.type === 'prediction';
  const username = userDisplayName(entity.user ?? {
    firstName: entity.createdBy || 'Admin',
  });

  return (
    <Elem {...props} name="entity" mod={{ selected }} onClick={onClick}>
      <Space spread>
        <Space size="small">
          <Elem
            name="userpic"
            tag={Userpic}
            showUsername
            username={isPrediction ? entity.createdBy : null}
            user={entity.user ?? { username }}
            mod={{ prediction: isPrediction }}
          >{isPrediction && <LsSparks color="#944BFF" style={{ width: 18, height: 18 }}/>}</Elem>
          <Space direction="vertical" size="none">
            <Elem name="user">
              <Elem name="name">{username} <span>#{entity.pk ?? entity.id}</span></Elem>
            </Elem>

            {isDefined(entity.acceptedState) && (
              <Elem name="review" mod={{ state: entity.acceptedState }}>
                {entity.acceptedState}
              </Elem>
            )}
          </Space>
        </Space>
        {extra}
      </Space>
    </Elem>
  );
});

import { useAnnotaionsList } from '@atoms/Models/AnnotationsAtom/Hooks/useAnnotationsList';
import { Annotation, AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { useInterfaces } from '@atoms/Models/RootAtom/Hooks';
import { Atom, useAtomValue } from 'jotai';
import { FC, MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSDK } from 'src/App';
import { IconPlusCircle, LsComment, LsCommentRed, LsSparks } from '../../assets/icons';
import { Space } from '../../common/Space/Space';
import { TimeAgo } from '../../common/TimeAgo/TimeAgo';
import { Userpic } from '../../common/Userpic/Userpic';
import { Block, Elem } from '../../utils/bem';
import { isDefined, userDisplayName } from '../../utils/utilities';
import { GroundTruth } from '../CurrentEntity/GroundTruth';
import './Annotations.styl';

type AnnotationListProps = {
  selectedAnnotation: AnnotationAtom,
  selectAnnotation: (annotation: AnnotationAtom) => void,
  updateAnnotation: (annotation: Partial<Annotation>) => void,
}

export const AnnotationsList: FC<AnnotationListProps> = ({
  selectedAnnotation,
  selectAnnotation,
}) => {
  const dropdownRef = useRef<HTMLElement | null>();
  const hasInterface = useInterfaces();
  const [opened, setOpened] = useState(false);
  const enableAnnotations = hasInterface('annotations:tabs');
  const enablePredictions = hasInterface('predictions:tabs');
  const enableCreateAnnotation = hasInterface('annotations:add-new');

  const entities = useAnnotaionsList({
    includeAnnotations: enableAnnotations,
    includePredictions: enablePredictions,
  });

  const onAnnotationSelect = useCallback((entity: AnnotationAtom) => {
    if (entity !== selectedAnnotation) {
      selectAnnotation(entity);
      setOpened(false);
    }
  }, [selectedAnnotation]);

  useEffect(() => {
    const handleClick = (e: globalThis.MouseEvent) => {
      const target = e.target as Node;
      const dropdown = dropdownRef.current;

      if (target !== dropdown && !dropdown?.contains(target)) {
        setOpened(false);
      }
    };

    document.addEventListener('click', handleClick);

    // const runOnPropertyChange = (value) => {
    //   let _unresolvedComments = 0;
    //   let _comments = 0;

    //   value.forEach(obj => {
    //     _comments++;

    //     if (!obj) _unresolvedComments++;
    //   });

    //   commentStore.annotation.setUnresolvedCommentCount(_unresolvedComments);
    //   commentStore.annotation.setCommentCount(_comments);
    // };

    // const reactionDisposer = reaction(
    //   () => [...commentStore.comments.map(item => item.isResolved)],
    //   runOnPropertyChange,
    // );

    // return () => {
    //   document.removeEventListener('click', handleClick);
    //   reactionDisposer();
    // };
  }, []);

  const counter = useMemo(() => {
    const currentIndex = entities.indexOf(selectedAnnotation) + 1;
    const total = entities.length;

    return [currentIndex, total];
  }, [selectAnnotation, entities.length]);

  return (enableAnnotations || enablePredictions || enableCreateAnnotation) ? (
    <Elem name="section" mod={{ flat: true }}>
      <Block name="annotations-list" ref={dropdownRef}>
        <Elem name="selected">
          <AnnotationListItem
            aria-label="Annotations List Toggle"
            entityAtom={selectedAnnotation}
            onClick={(e) => {
              e.stopPropagation();
              setOpened(!opened);
            }}
            extra={entities.length > 0 ? (
              <Space size="none" style={{ marginRight: -8, marginLeft: 8 }}>
                <Elem name="counter">
                  {counter.join('/')}
                </Elem>
                <Elem name="toggle" mod={{ opened }}/>
              </Space>
            ) : null}
          />
        </Elem>

        {opened && (
          <Elem name="list">
            {hasInterface('annotations:add-new') && (
              <CreateAnnotation onClick={() => setOpened(false)}/>
            )}

            <AnnotationListWrapper
              entities={entities}
              selectedAnnotationAtom={selectedAnnotation}
              onAnnotationSelect={onAnnotationSelect}
            />
          </Elem>
        )}
      </Block>
    </Elem>
  ) : null;
};

type CommentIconProps = {
  annotationAtom: Atom<Annotation>,
}

const CommentIcon: FC<CommentIconProps> = ({
  annotationAtom,
}) => {
  const entity = useAtomValue(annotationAtom);

  if (!entity) return null;

  if (entity.unresolved_comment_count > 0) {
    return <LsCommentRed />;
  } else if (entity.comment_count > 0) {
    return <LsComment />;
  }

  return null;
};

type AnnotationItemProps = {
  index: number,
  annotationAtom: Atom<Annotation>,
  selectedAnnotationAtom: AnnotationAtom,
  onAnnotationSelect: AnnotationListProps['selectAnnotation'],
}

const AnnotationItem: FC<AnnotationItemProps> = ({
  index,
  annotationAtom,
  selectedAnnotationAtom,
  onAnnotationSelect,
}) => {
  const hasInterface = useInterfaces();
  const groundTruthEnabled = hasInterface('ground-truth');
  const entity = useAtomValue(annotationAtom);
  const selected = useMemo(() => {
    return selectedAnnotationAtom === annotationAtom;
  }, [selectedAnnotationAtom, annotationAtom]);

  const onClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAnnotationSelect?.(annotationAtom as AnnotationAtom);
  }, []);

  return (
    <AnnotationListItem
      entityAtom={annotationAtom}
      aria-label={`${entity.type} ${index + 1}`}
      selected={selected}
      onClick={onClick}
      extra={(
        <Elem name={'icons'} >
          <Elem name="icon-column">
            <CommentIcon annotationAtom={annotationAtom}/>
          </Elem>
          <Elem name="icon-column">
            {groundTruthEnabled && (
              <GroundTruth
                annotationAtom={selectedAnnotationAtom}
                disabled
              />
            )}
          </Elem>
        </Elem>
      )}
    />
  );
};

type AnnotationListWrapperProps = {
  entities: Atom<Annotation>[],
  selectedAnnotationAtom: AnnotationItemProps['selectedAnnotationAtom'],
  onAnnotationSelect: AnnotationListProps['selectAnnotation'],
}

const AnnotationListWrapper: FC<AnnotationListWrapperProps> = ({
  entities,
  selectedAnnotationAtom,
  onAnnotationSelect,
}) => {
  return (
    <>
      <Elem name="draft">
        {entities.map((ent, index) => (
          <FilteredAnnotationsList
            key={ent.toString()}
            entity={ent}
            index={index}
            isDraft
            selectedAnnotationAtom={selectedAnnotationAtom}
            onAnnotationSelect={onAnnotationSelect}
          />
        ))}
      </Elem>
      <Elem name="annotation">
        {entities.map((ent, index) => (
          <FilteredAnnotationsList
            key={ent.toString()}
            entity={ent}
            index={index}
            selectedAnnotationAtom={selectedAnnotationAtom}
            onAnnotationSelect={onAnnotationSelect}
          />
        ))}
      </Elem>
    </>
  );
};

type FilteredAnnotationsListProps = {
  entity: Atom<Annotation>,
  index: number,
  isDraft?: boolean,
  selectedAnnotationAtom: AnnotationItemProps['selectedAnnotationAtom'],
  onAnnotationSelect: AnnotationListProps['selectAnnotation'],
}

const FilteredAnnotationsList: FC<FilteredAnnotationsListProps> = ({
  entity,
  index,
  isDraft,
  selectedAnnotationAtom,
  onAnnotationSelect,
}) => {
  const annotation = useAtomValue(entity);
  const sholdRender = isDraft ? annotation.type === 'draft' : annotation.type !== 'draft';

  return sholdRender ? (
    <AnnotationItem
      index={index}
      annotationAtom={entity}
      selectedAnnotationAtom={selectedAnnotationAtom}
      onAnnotationSelect={onAnnotationSelect}
    />
  ) : null;
};

const CreateAnnotation: FC<{
  onClick: (e: MouseEvent) => void,
}> = ({ onClick }) => {
  const SDK = useSDK();
  const onCreateAnnotation = useCallback((e: MouseEvent) => {
    const newAnnotation = SDK.annotations.create();

    SDK.annotations.select(newAnnotation);

    onClick(e);
  }, [onClick]);

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
};

type AnnotationListItemProps = {
  entityAtom: Atom<Annotation>,
  selected?: boolean,
  onClick?: (e: MouseEvent) => void,
  extra?: ReactNode,
}

const AnnotationListItem: FC<AnnotationListItemProps> = ({
  entityAtom,
  selected,
  onClick,
  extra,
  ...props
}) => {
  const entity = useAtomValue(entityAtom);
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
              <Elem tag="span" name="name">{username}</Elem>
              <Elem tag="span" name="entity-id">#{entity.pk ?? entity.id}</Elem>
            </Elem>

            {isDefined(entity.acceptedState) ? (
              <Elem name="review" mod={{ state: entity.acceptedState }}>
                {entity.acceptedState}
              </Elem>
            ) : (
              <Elem name="created">
                created, <Elem name="date" component={TimeAgo} date={entity.createdDate}/>
              </Elem>
            )}
          </Space>
        </Space>
        {extra}
      </Space>
    </Elem>
  );
};

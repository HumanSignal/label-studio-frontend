// import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { Block, Elem } from '../../utils/bem';
import { Userpic } from '../../common/Userpic/Userpic';
import {  IconDuplicate, IconEllipsis, IconTrashRect, LsCommentRed, LsSparks, LsStar, LsStarOutline } from '../../assets/icons';
import { userDisplayName } from '../../utils/utilities'; 
import { TimeAgo }  from '../../common/TimeAgo/TimeAgo';
// import { IconArrowLeft, IconArrowRight } from '../../assets/icons';
import './AnnotationButton.styl';
import { useCallback } from 'react';
import { Dropdown } from '../../common/Dropdown/Dropdown';
import { useDropdown } from '../../common/Dropdown/DropdownTrigger';
// eslint-disable-next-line
// @ts-ignore
import { confirm } from '../../common/Modal/Modal';
interface AnnotationButtonInterface {
  entity?: any;
  capabilities?: any;
  annotationStore?: any;
}

export const AnnotationButton = ({ entity, capabilities, annotationStore }: AnnotationButtonInterface) => {

  console.log('AnnotationButton', entity, capabilities);
  const iconSize = 37;
  const isPrediction = entity.type === 'prediction';
  const username = userDisplayName(entity.user ?? {
    firstName: entity.createdBy || 'Admin',
  });
  const clickHandler = useCallback(() => {
    const { selected, id, type } = entity;
    
    if (!selected) {
      if (type === 'prediction') {
        annotationStore.selectPrediction(id);
      } else {
        annotationStore.selectAnnotation(id);
      }
    }
  }, [entity]);
  const ContextMenu = ({ entity, capabilities }: AnnotationButtonInterface) => {
    const dropdown = useDropdown();
    const clickHandler = () => dropdown?.close();
    const setGroundTruth = useCallback(() => {
      entity.setGroundTruth(!entity.ground_truth);
      clickHandler();
    }, [entity]);
    const duplicateAnnotation = useCallback(() => {
      clickHandler();
    }, []);
    const deleteAnnotation = useCallback(() => {
      confirm({
        title: 'Delete annotation',
        body: 'This action cannot be undone',
        buttonLook: 'destructive',
        okText: 'Proceed',
        onOk: () => {
          entity.list.deleteAnnotation(entity);
          clickHandler();
        },
      });
    }, []);

    return (
      <Block name="AnnotationButtonContextMenu">
        {capabilities.groundTruthEnabled && (
          <Elem name='option' mod={{ groundTruth: true }} onClick={setGroundTruth}>
            {entity.ground_truth ? (
              <>
                <LsStar color='#FFC53D' width={iconSize} height={iconSize} /> Unset
              </>
            ) : (
              <>
                <LsStarOutline width={iconSize} height={iconSize} /> Set
              </>
            )} as Ground Truth
          </Elem>
        )}
        <Elem name='option' mod={{ duplicate: true }} onClick={duplicateAnnotation}>
          <Elem name='icon'><IconDuplicate width={20} height={24} /></Elem> Duplicate Annotation
        </Elem>
        <Elem name='seperator'></Elem>
        {capabilities.enableAnnotationDelete && (
          <Elem name='option' mod={{ delete: true }} onClick={deleteAnnotation}>
            <Elem name='icon'><IconTrashRect width={14} height={18} /></Elem> Delete Annotation
          </Elem>
        )}
      </Block>
    );
  };

  return (
    <Block name='annotation-button' mod={{ selected: entity.selected }}>
      <Elem name='mainSection' onClick={clickHandler}>
        <Elem
          name="userpic"
          tag={Userpic}
          showUsername
          username={isPrediction ? entity.createdBy : null}
          user={entity.user ?? { email: entity.createdBy }}
          mod={{ prediction: isPrediction }}
          size={24}
        >
          {isPrediction && <LsSparks style={{ width: 24, height: 24 }}/>}
        </Elem>
        <Elem name='main'>
          <Elem name="user">
            <Elem tag="span" name="name">{username}</Elem>
            <Elem tag="span" name="entity-id">#{entity.pk ?? entity.id}</Elem>
          </Elem>
          <Elem name="created">
            <Elem name="date" component={TimeAgo} date={entity.createdDate}/>
          </Elem>
        </Elem>
        {!isPrediction && (
          <Elem name='icons'>
            <Elem name='draft'></Elem>
            <Elem name='skipped'></Elem>
            <Elem name='ground-truth'></Elem>
            <Elem name='comments' tag={LsCommentRed}></Elem>
          </Elem>
        )}
      </Elem>
      <Elem name='contextMenu'>
        <Dropdown.Trigger
          content={<ContextMenu entity={entity} capabilities={capabilities} annotationStore={annotationStore} />}
        >
          <Elem name='ellipsisIcon'>
            <IconEllipsis width={28} height={28}/>
          </Elem>
        </Dropdown.Trigger>
      </Elem>
    </Block>
  );
};

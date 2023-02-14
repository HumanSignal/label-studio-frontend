// import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { Block, Elem } from '../../utils/bem';
import { Userpic } from '../../common/Userpic/Userpic';
import { IconAnnotationSkipped, IconDraftCreated, IconDuplicate, IconEllipsis, IconTrashRect, LsComment, LsCommentRed, LsSparks, LsStar, LsStarOutline } from '../../assets/icons';
import { userDisplayName } from '../../utils/utilities'; 
import { TimeAgo }  from '../../common/TimeAgo/TimeAgo';
// import { IconArrowLeft, IconArrowRight } from '../../assets/icons';
import './AnnotationButton.styl';
import { useCallback, useEffect, useState } from 'react';
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

const renderCommentIcon = (ent : any) => {
  if (ent.unresolved_comment_count > 0) {
    return LsCommentRed;
  } else if (ent.comment_count > 0) {
    return LsComment;
  }

  return null;
};

export const AnnotationButton = ({ entity, capabilities, annotationStore }: AnnotationButtonInterface) => {

  console.log('AnnotationButton', entity, capabilities, annotationStore);
  const iconSize = 37;
  const isPrediction = entity.type === 'prediction';
  const username = userDisplayName(entity.user ?? {
    firstName: entity.createdBy || 'Admin',
  });
  const [isGroundTruth, setIsGroundTruth] = useState<boolean>();
  const [isContextMenuOpen, setIsContextMenuOpen] = useState<boolean>(false);

  const CommentIcon = renderCommentIcon(entity);

  useEffect(() => {
    setIsGroundTruth(entity.ground_truth);
  }, [entity, entity.ground_truth]);

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
      entity.setGroundTruth(!isGroundTruth);
      clickHandler();
    }, [entity]);
    const duplicateAnnotation = useCallback(() => {
      const c = annotationStore.createAnnotation();

      console.log('duplicateAnnotation', c, entity);
  
      annotationStore.selectAnnotation(c.id);
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
            {isGroundTruth ? (
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
        {capabilities.enableAnnotationDelete && (
          <>
            <Elem name='seperator'></Elem>
            <Elem name='option' mod={{ delete: true }} onClick={deleteAnnotation}>
              <Elem name='icon'><IconTrashRect width={14} height={18} /></Elem> Delete Annotation
            </Elem>
          </>
        )}
      </Block>
    );
  };

  return (
    <Block name='annotation-button' mod={{ selected: entity.selected, contextMenuOpen: isContextMenuOpen }}>
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
          {isPrediction && <LsSparks style={{ width: 18, height: 18 }}/>}
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
            <Elem name='icon' mod={{ draft: true }}><IconDraftCreated color='#0099FF'/></Elem>
            <Elem name='icon' mod={{ skipped: true }}><IconAnnotationSkipped color='#DD0000' /></Elem>
            {isGroundTruth && <Elem name='icon' mod={{ groundTruth: true }}><LsStar width={22} height={22} /></Elem>}
            {CommentIcon && <Elem name='icon' mod={{ comments: true }}><CommentIcon /></Elem>}
          </Elem>
        )}
      </Elem>
      <Elem name='contextMenu'>
        <Dropdown.Trigger
          content={<ContextMenu entity={entity} capabilities={capabilities} annotationStore={annotationStore} />}
          onToggle={(isVisible)=> setIsContextMenuOpen(isVisible)}
        >
          <Elem name='ellipsisIcon'>
            <IconEllipsis width={28} height={28}/>
          </Elem>
        </Dropdown.Trigger>
      </Elem>
    </Block>
  );
};

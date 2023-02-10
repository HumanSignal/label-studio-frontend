// import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { Block, Elem } from '../../utils/bem';
import { Userpic } from '../../common/Userpic/Userpic';
import {  LsCommentRed, LsSparks } from '../../assets/icons';
import { userDisplayName } from '../../utils/utilities'; 
import { TimeAgo }  from '../../common/TimeAgo/TimeAgo';
// import { IconArrowLeft, IconArrowRight } from '../../assets/icons';
import './AnnotationButton.styl';

interface AnnotationButtonInterface {
  entity: any;
}

export const AnnotationButton = ({ entity }: AnnotationButtonInterface) => {
  
  console.log('AnnotationButton', entity);
  const prediction = entity.type === 'predection';
  const username = userDisplayName(entity.user ?? {
    firstName: entity.createdBy || 'Admin',
  });

  return (
    <Block name='annotation-button' mod={{ selected: entity.selected }}>
      <Elem
        name="userpic"
        tag={Userpic}
        showUsername
        username={prediction ? entity.createdBy : null}
        user={entity.user ?? { email: entity.createdBy }}
        mod={{ prediction }}
        size={24}
      >
        {prediction && <LsSparks style={{ width: 24, height: 24 }}/>}
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
      {!prediction && (
        <Elem name='icons'>
          <Elem name='draft'></Elem>
          <Elem name='skipped'></Elem>
          <Elem name='ground-truth'></Elem>
          <Elem name='comments' tag={LsCommentRed}></Elem>
        </Elem>
      )}
      <Elem name='contextMenu'></Elem>
    </Block>
  );
};

import { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Block } from '../../utils/bem';
import { CommentForm } from './CommentForm';
import { CommentsList } from './CommentsList';
import { useMounted } from '../../common/Utils/useMounted';
import { FF_DEV_3034, isFF } from '../../utils/feature-flags';

import './Comments.styl';


export const Comments: FC<{ commentStore: any, cacheKey?: string }> = observer(({ commentStore, cacheKey }) => {
  const mounted = useMounted();

  useEffect(() => {
    console.log('starting to listen');
    const evtSource = new EventSource("http://localhost:5000/listen");
    evtSource.onmessage = (event) => {
      console.log('event.data', event.data);
      const { createdById, isResolved, ...message } = JSON.parse(event.data);
      message.id = Math.floor(100000 * Math.random());
      message.createdBy = APP_SETTINGS.user.id;

      const newComments = [ ...commentStore.comments.toJSON()];
      const newComments2 = newComments.filter((comment) => {
        return comment.text !== message.text;
      });
      console.log('newComments', newComments2);

      newComments2.unshift(message);
      commentStore.setComments(newComments2);
      console.log('MESSAGE', message, newComments2);
    };
  }, []);


  const loadComments = async () => {
    await commentStore.listComments({ mounted });
    if (!isFF(FF_DEV_3034)) {
      commentStore.restoreCommentsFromCache(cacheKey);
    }
  };

  useEffect(() => {
    loadComments(); // will reset comments during load
    // id is internal id,
    // always different for different annotations, even empty ones;
    // remain the same when user submit draft, so no unneeded calls.
  }, [commentStore.annotation.id]);

  useEffect(() => {
    const confirmCommentsLoss = (e: any) => {

      if (commentStore.hasUnsaved) {
        e.returnValue = 'You have unpersisted comments which will be lost if continuing.';
      }

      return e;
    };

    // Need to handle this entirely separate to client-side based navigation
    window.addEventListener('beforeunload', confirmCommentsLoss);
    return () => {
      window.removeEventListener('beforeunload', confirmCommentsLoss);
    };
  }, [commentStore.hasUnsaved]);

  return (
    <Block name="comments">
      <CommentForm commentStore={commentStore} inline />
      <CommentsList commentStore={commentStore} />
    </Block>
  );
});

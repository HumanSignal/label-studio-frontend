import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { Block } from "../../utils/bem";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";
import { useMounted } from "../../common/Utils/useMounted";

import './Comments.styl';


export const Comments: FC<{ commentStore: any, cacheKey?: string }>= observer(({ commentStore, cacheKey }) => {
  const mounted = useMounted();

  const loadComments = async () => {
    await commentStore.listComments({ mounted });
    commentStore.restoreCommentsFromCache(cacheKey);
  };

  useEffect(() => {
    loadComments();
  }, [commentStore.parentId, cacheKey]);

  return (
    <Block name="comments">
      <CommentForm commentStore={commentStore} inline />
      <CommentsList commentStore={commentStore} />
    </Block>
  );
});

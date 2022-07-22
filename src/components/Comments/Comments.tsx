import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { Block } from "../../utils/bem";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";
import { useMounted } from "../../common/Utils/useMounted";

import './Comments.styl';


export const Comments: FC<{ commentStore: any }>= observer(({ commentStore }) => {
  const mounted = useMounted();

  useEffect(() => {
    commentStore.listComments({ mounted });
  }, [commentStore.parentId]);

  return (
    <Block name="comments">
      <CommentForm commentStore={commentStore} inline />
      <CommentsList commentStore={commentStore} />
    </Block>
  );
});

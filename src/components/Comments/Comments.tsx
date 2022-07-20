import { FC } from "react";
import { observer } from "mobx-react";
import { Block } from "../../utils/bem";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";

import './Comments.styl';


export const Comments: FC<{ commentStore: any }>= observer(({ commentStore }) => {

  return (
    <Block name="comments">
      <CommentForm commentStore={commentStore} inline />
      <CommentsList commentStore={commentStore} />
    </Block>
  );
});

import { observer } from "mobx-react-lite";
import { Block, Elem } from "../../utils/bem";
import { CommentForm } from "./CommentForm";

import './Comments.styl';

export const Comments = observer(() => {

  return (
    <Block name="comments">
      <CommentForm />
    </Block>
  );
});
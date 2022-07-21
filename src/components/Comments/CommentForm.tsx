import { FC, useCallback, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { ReactComponent as IconSend } from "../../assets/icons/send.svg";

import "./CommentForm.styl";
import { TextArea } from "../../common/TextArea/TextArea";
import { observer } from "mobx-react";


export type CommentFormProps = {
  commentStore: any,
  value?: string,
  onChange?: (value: string) => void,
  onInput?: (value: string) => void,
  inline?: boolean,
  rows?: number,
  maxRows?: number,
}

export const CommentForm: FC<CommentFormProps> = observer(({
  commentStore,
  value = "", 
  inline,
  onChange,
  onInput,
  rows = 1,
  maxRows = 3,
}) => {
  const [content, setContent] = useState(value);

  const onSubmit = useCallback((e: any) => {
    e.preventDefault();

    const comment = new FormData(e.target).get("comment");

    commentStore.addComment(comment);

    setContent('');
  }, []);

  return (
    <Block tag="form" name="comment-form" mod={{ inline }} onSubmit={onSubmit}> 
      <TextArea
        name="comment"
        placeholder="Add a comment"
        value={content}
        rows={rows}
        maxRows={maxRows}
        onChange={onChange}
        onInput={onInput}
        inlineAction={inline}
      />
      <Elem tag="div" name="primary-action">
        <button type="submit">
          <IconSend />
        </button>
      </Elem>
    </Block>
  );
});

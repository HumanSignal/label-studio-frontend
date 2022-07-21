import { FC, useCallback, useRef } from "react";
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
  inline = true,
  onChange,
  onInput,
  rows = 1,
  maxRows = 4,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const actionRef = useRef<{ clear?: () => void }>({});

  const onSubmit = useCallback(async (e?: any) => {
    e?.preventDefault?.();

    if (!formRef.current) return;
    
    const comment = new FormData(formRef.current).get("comment");

    try {
      await commentStore.addComment(comment);
      
      actionRef.current.clear?.();
    } catch(err) {
      console.log(err);
    }
  }, []);

  return (
    <Block ref={formRef} tag="form" name="comment-form" mod={{ inline }} onSubmit={onSubmit}> 
      <TextArea
        actionRef={actionRef}
        name="comment"
        placeholder="Add a comment"
        value={value}
        rows={rows}
        maxRows={maxRows}
        onChange={onChange}
        onInput={onInput}
        onSubmit={inline ? onSubmit : undefined}
      />
      <Elem tag="div" name="primary-action">
        <button type="submit">
          <IconSend />
        </button>
      </Elem>
    </Block>
  );
});

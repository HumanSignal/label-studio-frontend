import { FC, RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { ReactComponent as IconSend } from "../../assets/icons/send.svg";

import "./CommentForm.styl";
import { TextArea } from "../../common/TextArea/TextArea";
import { Tooltip } from "../../../src/common/Tooltip/Tooltip";
import { observer } from "mobx-react";


export type CommentFormProps = {
  commentStore: any,
  value?: string,
  onChange?: (value: string) => void,
  inline?: boolean,
  rows?: number,
  maxRows?: number,
}

export const CommentForm: FC<CommentFormProps> = observer(({
  commentStore,
  value = "", 
  inline = true,
  onChange,
  rows = 1,
  maxRows = 4,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const actionRef = useRef<{ update?: (text?: string) => void, ele?: RefObject<HTMLTextAreaElement> }>({});
  let isTooltipShowing = false;
  const onSubmit = useCallback(async (e?: any) => {
    e?.preventDefault?.();

    if (!formRef.current) return;
    
    const comment = new FormData(formRef.current).get("comment") as string;

    if (!comment.trim()) return;

    try {
      actionRef.current.update?.("");

      await commentStore.addComment(comment);
      
    } catch(err) {
      actionRef.current.update?.(comment || "");
      console.error(err);
    }
  }, [commentStore]);

  const onInput = useCallback((comment: string) => {
    commentStore.setCurrentComment(comment || '');
  }, [commentStore]);

  commentStore.setAddedCommentThisSession(false);

  useEffect(() => {
    commentStore.setInputRef(actionRef.current.ele);
    commentStore.setCommentFormSubmit(() => onSubmit());
  }, [actionRef, commentStore, formRef]);
  
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
        onFocus={() => {
          if(commentStore.tooltipMessage) {
            isTooltipShowing = true;
          }
        }}
        onBlur={() => {
          isTooltipShowing = false;
          commentStore.setTooltipMessage("");
        }}
      />
      {commentStore.tooltipMessage && (
        <Tooltip title="" theme="light">
          <>{commentStore.tooltipMessage}</>
        </Tooltip>
      )}
      <Elem tag="div" name="primary-action">
        <button type="submit">
          <IconSend />
        </button>
      </Elem>
    </Block>
  );
});

import { FC, useCallback, useEffect, useRef } from "react";
import { debounce } from "lodash";
import { Block, Elem } from "../../utils/bem";
import { ReactComponent as IconSend } from "../../assets/icons/send.svg";

import "./CommentForm.styl";


export type CommentFormProps = {
  value?: string,
  onChange?: (value: string) => void,
  onInput?: (value: string) => void,
  inline?: boolean,
  rows?: number,
  maxRows?: number,
}

export const CommentForm: FC<CommentFormProps> = ({
  value = "", 
  inline,
  onChange: _onChange,
  onInput: _onInput,
  rows = 1,
  maxRows = 3,
}) => {
  const autoGrowRef = useRef({
    rows,
    maxRows,
    lineHeight: 24,
    maxHeight: Infinity,
  });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const onSubmit = useCallback((e: any) => {
    e.preventDefault();
  }, []);

  const resizeTextArea = useCallback(debounce(() => {
    const textarea = textAreaRef.current;

    if (!textarea || !autoGrowRef.current) return;

    if (autoGrowRef.current.maxHeight === Infinity) {
      textarea.style.height = 'auto';
      const value = textAreaRef.current.value;

      textAreaRef.current.value = "";
      autoGrowRef.current.lineHeight = (textAreaRef.current.scrollHeight / autoGrowRef.current.rows);
      autoGrowRef.current.maxHeight = (autoGrowRef.current.lineHeight * autoGrowRef.current.maxRows);

      textAreaRef.current.value = value;
    }

    let newHeight: number;

    if(textarea.scrollHeight > autoGrowRef.current.maxHeight){
      textarea.style.overflowY = 'scroll';
      newHeight = autoGrowRef.current.maxHeight;
    } else {
      textarea.style.overflowY = 'hidden';
      textarea.style.height = 'auto';
      newHeight = textarea.scrollHeight;
    }
    const contentLength = textarea.value.length;
    const cursorPosition = textarea.selectionStart;

    requestAnimationFrame(() => {
      textarea.style.height = `${newHeight}px`;

      if (contentLength === cursorPosition) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    });
  }, 10, { leading: true }), []);

  const onInput = useCallback((e: any) => {
    _onInput?.(e.target.value);
    resizeTextArea();
  }, [_onInput]);

  const onChange = useCallback((e: any) => {
    _onChange?.(e.target.value);
    resizeTextArea();
  }, [_onChange]);

  useEffect(() => { 
    const resize = new ResizeObserver(resizeTextArea);

    resize.observe(textAreaRef.current as any);

    return () => {
      if (textAreaRef.current) {
        resize.unobserve(textAreaRef.current as any);
      } 
    }; 
  }, []);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.value = value;
    }
  }, [value]);

  return (
    <Block tag="form" name="comment-form" mod={{ inline }} onSubmit={onSubmit}> 
      <Elem tag="textarea" name="text-input" ref={textAreaRef} placeholder="Add a comment" rows={autoGrowRef.current.rows} onChange={onChange} onInput={onInput}></Elem>
      <Elem tag="div" name="primary-action">
        <button type="submit">
          <IconSend />
        </button>
      </Elem>
    </Block>
  );
};
import { useCallback } from "react";
import { Block, Elem } from "../../utils/bem";
import { ReactComponent as IconSend } from "../../assets/icons/send.svg";

import "./CommentForm.styl";


export const CommentForm = () => {
  const onSubmit = useCallback((e: any) => {
    e.preventDefault();
  }, []);

  return (
    <Block tag="form" name="comment-form" onSubmit={onSubmit}>
      <Elem tag="textarea" name="text-input" rows="1"></Elem>
      <Elem tag="button" name="primary-action"><IconSend /></Elem>
    </Block>
  );
};
import { observer } from "mobx-react";
import { FC, useState } from "react";
import { Tooltip } from "antd";
import { IconCheck, IconEllipsis } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Dropdown } from "../../common/Dropdown/Dropdown";
import { Menu } from "../../common/Menu/Menu";
import { Block, Elem } from "../../utils/bem";
import { humanDateDiff, userDisplayName } from "../../utils/utilities";
import { CommentFormBase } from "./CommentFormBase";

import "./CommentItem.styl";
import { Button } from "../../common/Button/Button";


export const CommentItem: FC<{ comment: any }> = observer(({ comment }) => {
  const resolved = comment.isResolved;
  const currentUser = window.APP_SETTINGS?.user;
  const initialComment = comment.text;
  const [currentComment, setCurrentComment] = useState(initialComment);

  if (comment.isDeleted) return null;

  return (
    <Block name="comment-item" mod={{ resolved }}>
      <Space spread size="medium" truncated>
        <Space size="small" truncated>
          <Elem
            tag={Userpic}
            user={comment.createdBy}
            name="userpic"
            showUsername
            username={comment.createdBy}
          ></Elem>
          <Elem name="name" tag="span">
            {userDisplayName(comment.createdBy)}
          </Elem>
        </Space>

        <Space size="small">
          <Elem name="resolved" component={IconCheck} />
          <Elem name="saving" mod={{ hide: comment.isPersisted }}>
            <Elem name="dot" />
          </Elem>

          {comment.isPersisted && comment.createdAt && (
            <Elem name="date">
              <Tooltip placement="topRight" title={new Date(comment.createdAt).toLocaleString()}>
                {humanDateDiff(comment.createdAt)}
              </Tooltip>
            </Elem>
          )}
        </Space>
      </Space>

      <Elem name="content">

        <Elem name="text">
          {(comment.isEditMode) ? (
            <CommentFormBase value={currentComment} onSubmit={async (value) => {
              await comment.updateComment(value);
              setCurrentComment(value);
            }}/>
          ) 
            : 
            (
              (comment.isConfirmDelete) ? (
                <Elem name="confirmForm">
                  <Elem name="question">Are you sure?</Elem>
                  <Elem name="controls">
                    <Button
                      onClick={() => comment.deleteComment()}
                      size="compact"
                      look="danger"
                      autoFocus
                    >
                    Yes
                    </Button>
                    <Button
                      onClick={() => comment.setConfirmMode(false)}
                      size="compact"
                    >
                    No
                    </Button>
                  </Elem>
                </Elem>
              ) 
                : 
                (
                  <>{currentComment}</>
                )
            )}
        </Elem>

        <Elem name="actions"
          onClick={(e: any) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {comment.isPersisted && (
            <Dropdown.Trigger content={(
              <Menu size="auto">
                <Menu.Item onClick={comment.toggleResolve}>
                  {resolved ? "Unresolve" : "Resolve"}
                </Menu.Item>
                {currentUser?.id === comment.createdBy.id && (
                  <>
                    <Menu.Item onClick={() => {
                      const isGoingIntoEditMode = !comment.isEditMode;

                      comment.setEditMode(isGoingIntoEditMode);
                      if(!isGoingIntoEditMode) {
                        setCurrentComment(initialComment);
                      }
                    }}>
                      {comment.isEditMode ? `Cancel edit` : `Edit`}
                    </Menu.Item>
                    {!comment.isConfirmDelete && (
                      <Menu.Item onClick={() => {
                        comment.setConfirmMode(true);
                      }}>
                        Delete
                      </Menu.Item>
                    )}
                  </>
                )}
              </Menu>
            )}>
              <Button size="small" type="text" icon={<IconEllipsis />} />
            </Dropdown.Trigger>
          )}
        </Elem>
      </Elem>
    </Block>
  );
});

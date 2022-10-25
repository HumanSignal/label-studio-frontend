import { useRef } from "react";
import { observer } from "mobx-react";
import { FC } from "react";
import { Tooltip } from "antd";
import { IconCheck, IconEllipsis } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Dropdown } from "../../common/Dropdown/Dropdown";
import { Menu } from "../../common/Menu/Menu";
import { Block, Elem } from "../../utils/bem";
import { humanDateDiff, userDisplayName } from "../../utils/utilities";

import "./CommentItem.styl";
import { Button } from "../../common/Button/Button";


export const CommentItem: FC<{ comment: any }> = observer(({ comment }) => {
  const resolved = comment.isResolved;

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
          {comment.text}
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

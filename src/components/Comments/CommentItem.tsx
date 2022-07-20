import { observer } from "mobx-react";
import { FC } from "react";
import { Tooltip } from "antd";
import { IconCheck } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import { humanDateDiff, userDisplayName } from "../../utils/utilities";

import "./CommentItem.styl";

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

          {comment.updatedAt && (
            <Elem name="date">
              <Tooltip placement="topRight" title={new Date(comment.updatedAt).toLocaleString()}>
                {humanDateDiff(comment.updatedAt)}
              </Tooltip>
            </Elem>
          )}
        </Space>
      </Space>

      <Elem name="content">
        {comment.content}
      </Elem>
    </Block>
  );
});

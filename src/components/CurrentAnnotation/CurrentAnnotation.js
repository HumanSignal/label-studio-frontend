import { observer } from "mobx-react";
import React from "react";
import { LsRedo, LsUndo, LsRemove, LsTrash } from "../../assets/icons";
import { Button } from "../../common/Button/Button";
import { confirm } from "../../common/Modal/Modal";
import { RadioGroup } from "../../common/RadioGroup/RadioGroup";
import { Space } from "../../common/Space/Space";
import { Tooltip } from "../../common/Tooltip/Tooltip";
import { Block, Elem } from "../../utils/bem";
import "./CurrentAnnotation.styl";

export const CurrentAnnotation = observer(({ annotation }) => {
  return annotation ? (
    <Block name="annotation" onClick={e => e.stopPropagation()}>
      <Elem name="info">
        ID: {annotation.id}
        <RadioGroup size="medium" defaultValue="latest">
          <RadioGroup.Button value="original">Original</RadioGroup.Button>
          <RadioGroup.Button value="latest">Latest</RadioGroup.Button>
        </RadioGroup>
      </Elem>

      <Space spread style={{ margin: "8px 0" }}>
        <HistoryActions history={annotation.history} />

        <Tooltip title="Delete annotation">
          <Button
            icon={<LsTrash />}
            look="danger"
            type="text"
            onClick={() => {
              confirm({
                title: "Delete annotaion",
                body: "This action cannot be undone",
                buttonLook: "destructive",
                okText: "Proceed",
                onOk: () => annotation.list.deleteAnnotation(annotation),
              });
            }}
            style={{
              height: 36,
              width: 36,
              padding: 0,
            }}
          />
        </Tooltip>
      </Space>

      <Elem name="actions">
        <Button look="danger">Reject</Button>
        <Button look="primary">Fix + Accept</Button>
      </Elem>
    </Block>
  ) : null;
});

const HistoryActions = observer(({ history }) => {
  return (
    <Block name="history">
      <Tooltip title="Undo">
        <Elem
          tag={Button}
          name="action"
          type="text"
          disabled={!history?.canUndo}
          onClick={() => history?.canUndo && history.undo()}
          icon={<LsUndo />}
        />
      </Tooltip>
      <Tooltip title="Redo">
        <Elem
          tag={Button}
          name="action"
          type="text"
          disabled={!history?.canRedo}
          onClick={() => history?.canRedo && history.redo()}
          icon={<LsRedo />}
        />
      </Tooltip>
      <Tooltip title="Reset">
        <Elem
          tag={Button}
          name="action"
          look="danger"
          type="text"
          disabled={!history?.canUndo}
          onClick={() => history?.reset()}
          icon={<LsRemove />}
        />
      </Tooltip>
    </Block>
  );
});

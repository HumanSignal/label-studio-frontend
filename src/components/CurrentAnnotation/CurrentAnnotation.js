import { observer } from "mobx-react";
import React from "react";
import { LsRedo, LsUndo, LsRemove, LsTrash } from "../../assets/icons";
import { Button } from "../../common/Button/Button";
import { RadioGroup } from "../../common/RadioGroup/RadioGroup";
import { Space } from "../../common/Space/Space";
import { Block, Elem } from "../../utils/bem";
import "./CurrentAnnotation.styl";

export const CurrentAnnotation = observer(({ annotation }) => {
  return annotation ? (
    <Block name="annotation" onClick={e => e.stopPropagation()}>
      <Elem name="info">
        ID: {annotation.id}
        <RadioGroup size="medium" value="latest">
          <RadioGroup.Button value="original">Original</RadioGroup.Button>
          <RadioGroup.Button value="latest">Latest</RadioGroup.Button>
        </RadioGroup>
      </Elem>

      <Space spread style={{ margin: "8px 0" }}>
        <HistoryActions history={annotation.history} />

        <Button
          icon={<LsTrash />}
          look="danger"
          type="text"
          style={{
            height: 36,
            width: 36,
            padding: 0,
          }}
        />
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
      <Elem
        tag={Button}
        name="action"
        type="text"
        disabled={!history?.canUndo}
        onClick={() => history?.canUndo && history.undo()}
        icon={<LsUndo />}
      />
      <Elem
        tag={Button}
        name="action"
        type="text"
        disabled={!history?.canRedo}
        onClick={() => history?.canRedo && history.redo()}
        icon={<LsRedo />}
      />
      <Elem
        tag={Button}
        name="action"
        look="danger"
        type="text"
        disabled={!history?.canUndo}
        onClick={() => history?.reset()}
        icon={<LsRemove />}
      />
    </Block>
  );
});

import { observer } from 'mobx-react';
import { LsRedo, LsUndo } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { Block, Elem } from '../../utils/bem';
import './HistoryActions.styl';

export const EditingHistory = observer(({ entity }) => {
  const { history } = entity;
  
  return (
    <Block name="history">
      <Tooltip title="Undo">
        <Elem
          tag={Button}
          name="action"
          type="text"
          aria-label="Undo"
          disabled={!history?.canUndo}
          onClick={() => entity.undo()}
          icon={<LsUndo />}
        />
      </Tooltip>
      <Tooltip title="Redo">
        <Elem
          tag={Button}
          name="action"
          type="text"
          aria-label="Redo"
          disabled={!history?.canRedo}
          onClick={() => entity.redo()}
          icon={<LsRedo />}
        />
      </Tooltip>
    </Block>
  );
});

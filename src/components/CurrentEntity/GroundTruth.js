import { observer } from 'mobx-react';
import { LsStar } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { BemWithSpecifiContext } from '../../utils/bem';
import './GroundTruth.styl';

const { Block, Elem } = BemWithSpecifiContext();

export const GroundTruth = observer(({ entity, disabled = false, size = 'md' }) => {
  const title = entity.ground_truth
    ? 'Unset this result as a ground truth'
    : 'Set this result as a ground truth';

  return (!entity.skipped && !entity.userGenerate && entity.type !== 'prediction') && (
    <Block name="ground-truth" mod={{ disabled, size }}>
      <Tooltip placement="topLeft" title={title}>
        <Elem
          tag={Button}
          name="toggle"
          size="small"
          type="link"
          onClick={ev => {
            ev.preventDefault();
            entity.setGroundTruth(!entity.ground_truth);
          }}
        >
          <Elem
            name="indicator"
            tag={LsStar}
            mod={{ active: entity.ground_truth }}
          />
        </Elem>
      </Tooltip>
    </Block>
  );
});

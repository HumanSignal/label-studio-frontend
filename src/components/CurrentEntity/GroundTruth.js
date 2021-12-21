import { observer } from "mobx-react";
import { LsStar } from "../../assets/icons";
import { Button } from "../../common/Button/Button";
import { Tooltip } from "../../common/Tooltip/Tooltip";
import { BemWithSpecifiContext } from "../../utils/bem";
import "./GroundTruth.styl";

const { Block, Elem } = BemWithSpecifiContext();

export const GroundTruth = observer(({ entity, disabled = false, size = 36 }) => {
  const title = entity.ground_truth
    ? "Unset this result as a ground truth"
    : "Set this result as a ground truth";

  const sizeStyle = {
    width: size,
    height: size,
  };

  return (!entity.skipped && !entity.userGenerate && entity.type !== 'prediction') && (
    <Block name="ground-truth" style={{ ...sizeStyle, pointerEvents: disabled ? "none" : "all" }}>
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
          style={{ ...sizeStyle, padding: 0 }}
        >
          <Elem
            name="indicator"
            tag={LsStar}
            mod={{ active: entity.ground_truth }}
            style={sizeStyle}
          />
        </Elem>
      </Tooltip>
    </Block>
  );
});

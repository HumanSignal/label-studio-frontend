import chroma from "chroma-js";
import { FC, memo, MouseEvent, useCallback, useContext, useMemo } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { TimelineContext } from "../../Context";
import { TimelineRegion } from "../../Types";
import "./Keypoints.styl";
import { visualizeLifespans } from "./Utils";

export interface KeypointsProps {
  region: TimelineRegion;
  startOffset: number;
  onSelectRegion: (e: MouseEvent<HTMLDivElement>, id: string) => void;
}

export const Keypoints: FC<KeypointsProps> = ({
  region,
  startOffset,
  onSelectRegion,
}) => {
  const { step } = useContext(TimelineContext);
  const { label, color, visible, sequence, selected } = region;

  const firtsPoint = sequence[0];
  const start = firtsPoint.frame - 1;
  const offset = start * step;

  const styles = {
    '--offset': `${startOffset}px`,
    '--color': color,
    '--point-color': chroma(color).alpha(1).css(),
    '--lifespan-color': chroma(color).alpha(visible ? 0.4 : 1).css(),
  };

  const lifespans = useMemo(() => {
    return visualizeLifespans(sequence, step);
  }, [sequence, start, step]);

  const onSelectRegionHandler = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelectRegion?.(e, region.id);
    console.log(123123);
  }, [region.id, onSelectRegion]);

  return (
    <Block
      name="keypoints"
      style={styles}
      mod={{ selected }}
      onClick={onSelectRegionHandler}
    >
      <Elem name="label">
        <Elem name="name">
          {label}
        </Elem>
        {/* <Elem name="data">
          {region.id}
        </Elem> */}
      </Elem>
      <Elem name="keypoints">
        {lifespans.map((lifespan, i) => {
          const isLast = i + 1 === lifespans.length;
          const { points, ...data } = lifespan;

          return (
            <Lifespan
              key={i}
              mainOffset={offset}
              step={step}
              isLast={isLast}
              visible={visible}
              points={points.map(({ frame }) => frame)}
              {...data}
            />
          );
        })}
      </Elem>
    </Block>
  );
};

interface LifespanProps {
  mainOffset: number;
  width: string | number;
  step: number;
  start: number;
  offset: number;
  enabled: boolean;
  visible: boolean;
  isLast: boolean;
  points: number[];
}

const Lifespan: FC<LifespanProps> = memo(({
  mainOffset,
  width,
  start,
  step,
  offset,
  enabled,
  visible,
  isLast,
  points,
}) => {
  const left = mainOffset + offset + (step / 2);
  const right = (isLast && enabled) ? 0 : 'auto';
  const finalWidth = (isLast && enabled) ? 'auto' : width;

  return (
    <Elem name="lifespan" mod={{ hidden: !visible }} style={{ left, width: finalWidth, right }}>
      {points.map((frame, i) => {
        const left = (frame - start) * step;

        return <Elem key={i} name="point" style={{ left }} />;
      })}
    </Elem>
  );
});

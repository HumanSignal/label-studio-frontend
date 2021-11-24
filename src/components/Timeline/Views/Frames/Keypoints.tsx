import chroma from "chroma-js";
import { FC, MouseEvent, useCallback, useContext, useMemo } from "react";
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
          const left = offset + lifespan.offset + (step / 2);
          const right = (isLast && lifespan.enabled) ? 0 : 'auto';
          const width = (isLast && lifespan.enabled) ? 'auto' : lifespan.width;

          return (
            <Elem key={i} name="lifespan" mod={{ hidden: !visible }} style={{ left, width, right }}>
              {lifespan.points.map((point, j) => {
                const left = (point.frame - lifespan.start) * step;

                return <Elem key={i+j} name="point" style={{ left }} />;
              })}
            </Elem>
          );
        })}
      </Elem>
    </Block>
  );
};

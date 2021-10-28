import { JSX } from "@babel/types";
import chroma from "chroma-js";
import { FC, MouseEvent, useContext, useMemo, useState } from "react";
import { IconCross, IconEyeClosed, IconEyeOpened } from "../../../../assets/icons/timeline";
import { Block, Elem } from "../../../../utils/bem";
import { TimelineContext } from "../../Context";
import { TimelineRegion } from "../../Types";

import "./Keypoints.styl";
import { visualizeLifespans } from "./Utils";
export interface KeypointsProps {
  region: TimelineRegion;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDeleteRegion: (id: string) => void;
  onSelectRegion: (e: MouseEvent<HTMLDivElement>, id: string) => void;
}

export const Keypoints: FC<KeypointsProps> = ({
  region,
  onSelectRegion,
  onToggleVisibility,
  onDeleteRegion,
}) => {
  const { step } = useContext(TimelineContext);
  const { label, color, visible, selected, sequence } = region;
  const [hovered, setHovered] = useState(false);

  const background = chroma(color).alpha(0.3).css();
  const borderColor = chroma(color).alpha(0.2).css();

  const firtsPoint = sequence[0];
  const lastPoint = sequence[sequence.length - 1];

  const start = firtsPoint.frame - 1;
  const end = lastPoint.frame;
  const infinite = lastPoint.enabled === true;
  const offset = start * step;

  const styles = {
    'marginLeft': `${offset}px`,
    'width': infinite ? 'auto' : (end * step) - offset,
    '--hover': background,
    '--background': selected ? color : background,
    '--border': selected ? 'transparent' : borderColor,
    '--color': selected ? '#fff' : color,
    '--point-color': color,
  };

  const lifespans = useMemo(() => {
    return visualizeLifespans(sequence, step);
  }, [sequence, start, step]);

  return (
    <Block
      name="keypoints"
      style={styles}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Elem name="label">
        <Elem
          name="name"
          onClick={(e: MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            onSelectRegion?.(e, region.id);
          }}
        >
          {label}
        </Elem>
        <Elem name="actions">
          <RegionAction
            label={visible ? <IconEyeOpened/> : <IconEyeClosed/>}
            onClick={() => onToggleVisibility?.(region.id, !visible)}
            visible={!visible || hovered}
          />
          <RegionAction
            danger
            label={<IconCross/>}
            onClick={() => onDeleteRegion?.(region.id)}
            visible={hovered}
          />
        </Elem>
      </Elem>
      <Elem name="keypoints">
        {lifespans.map((lifespan, i) => {
          const isLast = i + 1 === lifespans.length;
          const left = lifespan.offset + (step / 2);
          const right = (isLast && lifespan.enabled) ? 0 : 'auto';
          const width = (isLast && lifespan.enabled) ? 'auto' : lifespan.width;

          return (
            <Elem key={i} name="connection" mod={{ hidden: !visible }} style={{ left, width, right }}>
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

const RegionAction: FC<{
  label: string | JSX.Element,
  visible?: boolean,
  danger?: boolean,
  onClick?: (e: MouseEvent<HTMLDivElement>) => void,
}> = ({ label, onClick, danger, visible }) => {
  return visible ?(
    <Block
      name="region-action"
      mod={{ danger }}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        onClick?.(e);
      }}>
      {label}
    </Block>
  ) : null;
};

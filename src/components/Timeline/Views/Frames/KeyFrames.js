import chroma from "chroma-js";
import { useMemo } from "react";
import { IconCross, IconEyeClosed, IconEyeOpened } from "../../../../assets/icons/timeline";
import { Block, Elem } from "../../../../utils/bem";

import "./KeyFrames.styl";

export const KeyFrames = ({ region, step, onToggleVisibility, onDeleteRegion }) => {
  const { label, color, visible, selected, keyframes } = region;

  const background = chroma(color).alpha(0.3).css();
  const borderColor = chroma(color).alpha(0.2);

  const firtsPoint = keyframes[0];
  const lastPoint = keyframes[keyframes.length - 1];

  const start = firtsPoint.frame - 1;
  const end = lastPoint.frame;
  const infinite = lastPoint.stop === false;
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

  const connections = useMemo(() => {
    const lines = [];

    for(let i = 0, l = keyframes.length; i < l; i++) {
      const lastLine = lines[lines.length - 1];
      const point = keyframes[i];
      const prevPoint = keyframes[i-1];
      const offset = (point.frame - start - 1) * step;

      if (!lastLine || prevPoint?.stop) {
        lines.push({ offset, start: point.frame, width: 0, points: [point] });
      } else if (!prevPoint?.stop) {
        lastLine.width = (point.frame - lastLine.points[0].frame) * step;
        lastLine.points.push(point);
      }
    }

    return lines;
  }, [keyframes, start, step]);

  return (
    <Block name="keyframes" style={styles}>
      <Elem name="label">
        <Elem name="name">{label}</Elem>
        <Elem name="actions">
          <RegionAction
            label={visible ? <IconEyeOpened/> : <IconEyeClosed/>}
            onClick={() => onToggleVisibility?.(region.id, !visible)}
          />
          <RegionAction
            danger
            label={<IconCross/>}
            onClick={() => onDeleteRegion?.(region.id)}
          />
        </Elem>
      </Elem>
      <Elem name="keypoints">
        {connections.map((conn, i) => {
          return (
            <Elem
              key={i}
              name="connection"
              style={{
                left: conn.offset + (step / 2),
                width: conn.width ? conn.width : '100%',
              }}
            >
              {conn.points.map((point, j) => {
                const frame = point.frame - conn.start;

                return (
                  <Elem key={i+j} name="point" style={{ left: frame * step }} />
                );
              })}
            </Elem>
          );
        })}
      </Elem>
    </Block>
  );
};

const RegionAction = ({ label, onClick, danger }) => {
  return (
    <Block
      name="region-action"
      mod={{ danger }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}>
      {label}
    </Block>
  );
};

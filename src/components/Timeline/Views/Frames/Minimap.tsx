import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { isDefined } from "../../../../utils/utilities";
import { TimelineMinimapProps } from "../../Types";
import { visualizeKeyframes } from "./Utils";
import "./Minimap.styl";

export const Minimap: FC<TimelineMinimapProps> = ({ regions, length }) => {
  const root = useRef<HTMLDivElement>();
  const [step, setStep] = useState(0);

  const visualization = useMemo(() => {
    return regions.map((region) => {
      return {
        id: region.id,
        color: region.color,
        connections: visualizeKeyframes(region.keyframes, step),
      };
    });
  }, [step, regions]);

  useEffect(() => {
    if (isDefined(root.current) && length > 0) {
      setStep(root.current.clientWidth / length);
    }
  }, [length]);

  return (
    <Block ref={root} name="minimap">
      {visualization.slice(0, 5).map(({ id, color, connections }) => {
        return (
          <Elem key={id} name="region" style={{ '--color': color }}>
            {connections.map((connection, i) => {
              const isLast = i + 1 === connections.length;
              const left = connection.start * step;
              const width = (isLast && connection.enabled) ? '100%' : connection.width;

              return (
                <Elem key={`${id}${i}`} name="connection" style={{ left, width }}/>
              );
            })}
          </Elem>
        );
      })}
    </Block>
  );
};

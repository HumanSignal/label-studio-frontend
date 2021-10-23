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
      const step = root.current.clientWidth / length;

      console.log(step, root.current.clientWidth, length);

      setStep(step);
    }
  }, [length]);

  return (
    <Block ref={root} name="minimap">
      {visualization.slice(0, 5).map(region => {
        return (
          <Elem key={region.id} name="region" style={{ '--color': region.color }}>
            {region.connections.map((connection, i) => {
              return (
                <Elem
                  key={`${region.id}${i}`} name="connection"
                  style={{
                    left: connection.start * step,
                    width: connection.stop ? connection.width : '100%',
                  }}
                />
              );
            })}
          </Elem>
        );
      })}
    </Block>
  );
};

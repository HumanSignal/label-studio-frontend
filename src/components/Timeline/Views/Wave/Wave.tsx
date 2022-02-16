import { FC, useContext, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { TimelineContext } from "../../Context";
import { TimelineViewProps } from "../../Types";
import WaveSurfer from "wavesurfer.js";
import "./Wave.styl";

export const Wave: FC<TimelineViewProps> = ({
  position,
  length,
}) => {
  const { data } = useContext(TimelineContext);
  const [loading, setLoading] = useState(true);
  const waveRef = useRef<HTMLElement>();
  const ws = useRef<WaveSurfer>();

  useEffect(() => {
    ws.current = WaveSurfer.create({
      container: waveRef.current!,
      height: 88,
    });

    ws.current.on("ready", () => {
      setLoading(false);
    });

    ws.current.load(data._value);

    return () => ws.current?.destroy();
  }, []);

  useEffect(() => {
    ws.current?.seekTo(position / length);
  }, [position, length]);

  return (
    <Block name="wave">
      {loading && <Elem name="loader" mod={{ animated: true }}/>}
      <Elem name="surfer" ref={waveRef} />
    </Block>
  );
};

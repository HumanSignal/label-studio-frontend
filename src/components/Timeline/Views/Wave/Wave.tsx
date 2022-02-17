import { FC, useContext, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { TimelineContext } from "../../Context";
import { TimelineViewProps } from "../../Types";
import WaveSurfer from "wavesurfer.js";
import "./Wave.styl";

export const Wave: FC<TimelineViewProps> = ({
  position,
  length,
  playing,
  onReady,
  onChange,
}) => {
  const { data } = useContext(TimelineContext);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const tracker = useRef<NodeJS.Timeout>();
  const waveRef = useRef<HTMLElement>();
  const ws = useRef<WaveSurfer>();

  useEffect(() => {
    const wsi = WaveSurfer.create({
      container: waveRef.current!,
      height: 88,
    });

    wsi.on("ready", () => {
      setLoading(false);

      onReady?.({
        duration: wsi.getDuration(),
      });
    });

    wsi.on("seek", (progress) => {
      onChange?.((wsi.getDuration() * progress) * 1000);
    });

    wsi.on("loading", (progress) => {
      setProgress(progress);
    });

    wsi.load(data._value);

    ws.current = wsi;

    return () => ws.current?.destroy();
  }, []);

  useEffect(() => {
    const wsi = ws.current;

    if (wsi && !playing) {
      wsi.seekTo(position / length);
    }
  }, [position, playing, length]);

  useEffect(() => {
    const wsi = ws.current;

    if (wsi) {
      if (playing) {
        wsi.play();

        const trackProgress = () => {
          onChange?.(wsi.getCurrentTime() * 1000);

          tracker.current = setTimeout(trackProgress);
        };

        tracker.current = setTimeout(trackProgress);
      } else {
        wsi.pause();
        clearTimeout(tracker.current!);
      }
    }
  }, [playing]);

  return (
    <Block name="wave">
      {loading && <Elem name="loader" mod={{ animated: true }}/>}
      <Elem name="surfer" ref={waveRef} />
    </Block>
  );
};

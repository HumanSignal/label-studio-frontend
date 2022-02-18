import { FC, MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { TimelineContext } from "../../Context";
import { TimelineViewProps } from "../../Types";
import WaveSurfer from "wavesurfer.js";
import "./Wave.styl";
import RegionsPlugin from "wavesurfer.js/src/plugin/regions";
import TimelinePlugin from "wavesurfer.js/src/plugin/timeline";
import { formatTimeCallback, primaryLabelInterval, secondaryLabelInterval, timeInterval } from "./Utils";
import { clamp } from "lodash";
import { isMacOS } from "../../../../utils/utilities";

export const Wave: FC<TimelineViewProps> = ({
  position,
  length,
  playing,
  regions,
  onReady,
  onChange,
  onAddRegion,
}) => {
  const { data } = useContext(TimelineContext);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const tracker = useRef<NodeJS.Timeout>();
  const waveRef = useRef<HTMLElement>();
  const timelineRef = useRef<HTMLElement>();
  const ws = useRef<WaveSurfer>();

  const setScroll = useCallback((scrollRatio: number) => {
    const surfer = waveRef.current?.querySelector("wave");

    if (surfer)  surfer.scrollLeft = scrollRatio * surfer.scrollWidth;
  }, []);

  useEffect(() => {
    const wsi = WaveSurfer.create({
      container: waveRef.current!,
      height: 88,
      hideScrollbar: true,
      // partialRender: true,
      normalize: true,
      // maxCanvasWidth: 8000,
      // pixelRatio: 1,
      plugins: [
        RegionsPlugin.create({
          slop: 5,
          deferInit: true,
          dragSelection: true,
        }),
        TimelinePlugin.create({
          deferInit: true,
          container: timelineRef.current!,
          formatTimeCallback,
          timeInterval,
          secondaryLabelInterval,
          primaryColor: "rgba(0,0,0,0.1)",
          secondaryColor: "rgba(0,0,0,0.1)",
          primaryFontColor: "rgba(0,0,0,0.4)",
          secondaryFontColor: "#000",
          labelPadding: 5,
          unlabeledNotchColor: "#ccc",
          notchPercentHeight: 50,
        }),
      ],
    });

    wsi.on("ready", () => {
      setLoading(false);
      wsi.initPlugin("regions");
      wsi.initPlugin("timeline");

      if (regions) {
        /**
         * Mouse enter on region
         */
        wsi.on("region-mouseenter", reg => {
          reg._region?.onMouseOver();
        });

        /**
         * Mouse leave on region
         */
        wsi.on("region-mouseleave", reg => {
          reg._region?.onMouseLeave();
        });

        /**
         * Add region to wave
         */
        wsi.on("region-created", (reg) => {
          const region = onAddRegion?.(reg);

          if (!region) return;

          reg._region = region;
          reg.color = region.selectedregionbg;

          reg.on("click", (ev: any) => region.onClick(wsi, ev));
          reg.on("update-end", () => region.onUpdateEnd(wsi));

          reg.on("dblclick", () => {
            window.setTimeout(function() {
              reg.play();
            }, 0);
          });

          reg.on("out", () => {});
        });
      }

      onReady?.({
        duration: wsi.getDuration(),
        surfer: wsi,
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

    Object.assign(window, { surfer: wsi });

    return () => {
      wsi.destroyPlugin("regions");
      wsi.destroyPlugin("timeline");
      wsi.destroy();
    };
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

  useEffect(() => {
    requestAnimationFrame(() => {
      const wsi = ws.current;

      if (wsi && wsi.params.minPxPerSec !== zoom) ws.current?.zoom(zoom);
    });
  }, [zoom, scrollOffset]);

  useEffect(() => {
    setScroll(scrollOffset);
  }, [scrollOffset]);

  useEffect(() => {
    const elem = waveRef.current!;
    const wave = elem.querySelector("wave")!;

    const onWheel = (e: WheelEvent) => {
      if ((e.ctrlKey || isMacOS()) && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        setZoom(Math.round(zoom + (-e.deltaY * 1.2)));
        return;
      }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();

      const newScroll = clamp(wave.scrollLeft + (e.deltaX * 1.25), 0, wave.scrollWidth);

      setScrollOffset(newScroll / wave.scrollWidth);
    };

    elem.addEventListener('wheel', onWheel);

    return () => elem.removeEventListener('wheel', onWheel);
  }, [zoom]);

  return (
    <Block name="wave">
      <input data-action="zoom" type="range" min="1" max="1500" step={1} value={zoom} onChange={(e) => {

        setZoom(Number(e.target.value));
      }}/>
      {loading && <Elem name="loader" mod={{ animated: true }}/>}
      <Elem name="surfer" ref={waveRef} />
      <Elem name="timeline" ref={timelineRef}/>
    </Block>
  );
};

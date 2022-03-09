import { CSSProperties, FC, MutableRefObject, MouseEvent as RMouseEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { TimelineContext } from "../../Context";
import { TimelineContextValue, TimelineViewProps } from "../../Types";
import WaveSurfer from "wavesurfer.js";
import "./Wave.styl";
import RegionsPlugin from "wavesurfer.js/src/plugin/regions";
import TimelinePlugin from "wavesurfer.js/src/plugin/timeline";
import { formatTimeCallback, secondaryLabelInterval, timeInterval } from "./Utils";
import { clamp, isDefined, isMacOS } from "../../../../utils/utilities";
import { Range } from "../../../../common/Range/Range";
import { IconFast, IconSlow, IconZoomIn, IconZoomOut } from "../../../../assets/icons";
import { Space } from "../../../../common/Space/Space";
import CursorPlugin from "wavesurfer.js/src/plugin/cursor";
import { useMemoizedHandlers } from "../../../../hooks/useMemoizedHandlers";
import { useMemo } from "react";
import { WaveSurferParams } from "wavesurfer.js/types/params";

const ZOOM_X = {
  min: 10,
  max: 1500,
  step: 10,
  default: 10,
};

const SPEED = {
  min: 0.5,
  max: 2,
  step: 0.01,
  default: 1,
};

export const Wave: FC<TimelineViewProps> = ({
  position,
  length,
  playing,
  regions,
  zoom = ZOOM_X.default,
  volume = 1,
  speed = SPEED.default,
  onReady,
  onChange,
  onAddRegion,
  onZoom,
  onPlayToggle,
  onSpeedChange,
}) => {
  const { data } = useContext(TimelineContext);

  const tracker = useRef<NodeJS.Timeout>();
  const waveRef = useRef<HTMLElement>();
  const timelineRef = useRef<HTMLElement>();
  const bodyRef = useRef<HTMLElement>();

  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [loading, setLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [scale, setScale] = useState(1);
  const [startOver, setStartOver] = useState(false);

  const handlers = useMemoizedHandlers({
    onChange,
    onZoom,
  });

  const setZoom = useCallback((value: number) => {
    const newValue = clamp(value, ZOOM_X.min, ZOOM_X.max);

    setCurrentZoom(newValue);
  }, []);

  const ws = useWaveSurfer({
    containter: waveRef,
    timelineContainer: timelineRef,
    speed,
    regions,
    data,
    params: {
      autoCenter: data.autocenter,
      scrollParent: data.scrollparent,
      autoCenterImmediately: true,
    },
    onLoaded: setLoading,
    onProgress: setProgress,
    onPlayToggle,
    onAddRegion,
    onReady,
    onScroll: (p) => setScrollOffset(p),
    onSeek: (p) => handlers.onChange?.(p),
    onZoom: (zoom) => handlers.onZoom?.(zoom),
    onPlayFinished: () => {
      setStartOver(true);
      onPlayToggle?.(false);
    },
  });

  // Handle timeline navigation clicks
  const onTimelineClick = useCallback((e: RMouseEvent<HTMLDivElement>) => {
    const surfer = waveRef.current!.querySelector("wave")!;
    const offset = surfer.getBoundingClientRect().left;
    const duration = ws.current?.getDuration();
    const relativeOffset = (surfer.scrollLeft + (e.clientX - offset)) / surfer.scrollWidth;
    const time = relativeOffset * (duration ?? 0);

    ws.current?.setCurrentTime(time);
  }, []);

  // Handle current cursor position
  useEffect(() => {
    let pos = 0;
    const surfer = waveRef.current?.querySelector?.("wave");

    if (surfer && length > 0) {
      const relativePosition = position / length;
      const offset = (surfer.scrollWidth * relativePosition) - surfer.scrollLeft;

      pos = offset;
    }

    setCursorPosition(pos);
  }, [position, length, zoom, currentZoom, scrollOffset, loading]);

  // Handle seeking
  useEffect(() => {
    const wsi = ws.current;

    if (wsi && !playing) {
      const pos = clamp(position / length, 0, 1);

      if (!isNaN(pos)) wsi.seekTo(pos);
    }
  }, [position, playing, length]);

  // Handle playback updates
  useEffect(() => {
    const wsi = ws.current;

    if (wsi) {
      if (playing) {
        setStartOver(false);
        wsi.play(startOver ? 0 : undefined);

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

  // Handle zoom changes
  useEffect(() => {
    requestAnimationFrame(() => {
      const wsi = ws.current;

      if (wsi && wsi.params.minPxPerSec !== currentZoom) ws.current?.zoom(currentZoom);
    });
  }, [currentZoom, scrollOffset]);

  // Handle playback speed changes
  useEffect(() => {
    ws.current?.setPlaybackRate(speed);
  }, [speed]);

  // Handle waveform scrolling position change
  useEffect(() => {
    const surfer = waveRef.current?.querySelector("wave");

    if (surfer)  surfer.scrollLeft = scrollOffset;
  }, [scrollOffset]);

  // Handle volume change
  useEffect(() => {
    ws.current?.setVolume(volume);
  }, [volume]);

  // Handle Y scaling
  useEffect(() => {
    const wsi = ws.current;

    if (wsi) {
      wsi.params.barHeight = scale;
      wsi.drawBuffer();
    }
  }, [scale]);

  // Handle wheel events for scrolling and pinch-to-zoom
  useEffect(() => {
    const elem = bodyRef.current!;
    const wave = elem.querySelector("wave")!;
    const isMac = isMacOS();

    const onWheel = (e: WheelEvent) => {
      const isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      const isHorizontal = Math.abs(e.deltaY) < Math.abs(e.deltaX);

      // on macOS trackpad triggers ctrlKey automatically
      // on other platforms you must physically hold ctrl
      if (e.ctrlKey && isVertical) {
        e.preventDefault();
        requestAnimationFrame(() => {
          setZoom(Math.round(currentZoom + (-e.deltaY * 1.2)));
        });
        return;
      }

      if ((isHorizontal && isMac) || (isVertical || e.shiftKey)) e.preventDefault();

      const newScroll = () => {
        const delta = (!isMac || e.shiftKey) ? e.deltaY : e.deltaX;

        return clamp(wave.scrollLeft + (delta * 1.25), 0, wave.scrollWidth);
      };

      setScrollOffset(newScroll());
    };

    elem.addEventListener('wheel', onWheel);

    return () => elem.removeEventListener('wheel', onWheel);
  }, [currentZoom]);

  // Cursor styles
  const cursorStyle = useMemo<CSSProperties>(() => {
    return {
      left: cursorPosition,
      width: Number(data.cursorwidth ?? 2),
      background: data.cursorcolor,
    };
  }, [cursorPosition]);

  return (
    <Block name="wave">
      <Elem name="controls">
        <Space spread>
          <Range
            continuous
            value={speed}
            {...SPEED}
            resetValue={SPEED.default}
            minIcon={<IconSlow style={{ color: "#99A0AE" }} />}
            maxIcon={<IconFast style={{ color: "#99A0AE" }} />}
            onChange={(value) => onSpeedChange?.(Number(value))}
          />

          <Range
            continuous
            value={currentZoom}
            {...ZOOM_X}
            resetValue={ZOOM_X.default}
            minIcon={<IconZoomOut />}
            maxIcon={<IconZoomIn />}
            onChange={value => setZoom(Number(value))}
          />
        </Space>
      </Elem>
      <Elem name="wrapper">
        <Elem
          name="body"
          ref={bodyRef}
          onClick={onTimelineClick}
        >
          <Elem name="cursor" style={cursorStyle}/>
          <Elem name="surfer" ref={waveRef} onClick={(e: RMouseEvent<HTMLElement>) => e.stopPropagation()}/>
          <Elem name="timeline" ref={timelineRef} />
          {loading && (
            <Elem name="loader" mod={{ animated: true }}>
              <span>{progress}%</span>
            </Elem>
          )}
        </Elem>
        <Elem name="scale">
          <Range
            min={1}
            max={50}
            step={0.1}
            reverse
            continuous
            value={scale}
            resetValue={1}
            align="vertical"
            onChange={(value) => setScale(Number(value))}
          />
        </Elem>
      </Elem>
    </Block>
  );
};

interface WavesurferProps {
  containter: MutableRefObject<HTMLElement | undefined>;
  timelineContainer: MutableRefObject<HTMLElement | undefined>;
  regions: any[];
  speed: number;
  data: TimelineContextValue["data"];
  params: Partial<WaveSurferParams>;
  onProgress: (progress: number) => void;
  onSeek: (progress: number) => void;
  onLoaded: (loaded: boolean) => void;
  onScroll: (position: number) => void;
  onZoom?: (zoom: number) => void;
  onPlayToggle?: TimelineViewProps["onPlayToggle"];
  onReady?: TimelineViewProps["onReady"];
  onAddRegion?: TimelineViewProps["onAddRegion"];
  onPlayFinished: () => void;
}

const useWaveSurfer = ({
  containter,
  timelineContainer,
  regions,
  speed,
  data,
  params,
  onLoaded,
  onProgress,
  onSeek,
  onPlayToggle,
  onPlayFinished,
  onAddRegion,
  onReady,
  onScroll,
  onZoom,
}: WavesurferProps) => {
  const ws = useRef<WaveSurfer>();

  useEffect(() => {
    const wsi = WaveSurfer.create({
      autoCenter: true,
      scrollParent: true,
      ...params,
      barHeight: 1,
      container: containter.current!,
      height: Number(data.height ?? 88),
      hideScrollbar: true,
      maxCanvasWidth: 8000,
      waveColor: "#D5D5D5",
      progressColor: "#656F83",
      cursorWidth: 0,
      loopSelection: true,
      audioRate: speed,
      pixelRatio: 1,
      plugins: [
        RegionsPlugin.create({
          slop: 5,
          deferInit: true,
          dragSelection: true,
        }),
        TimelinePlugin.create({
          deferInit: true,
          container: timelineContainer.current!,
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
        CursorPlugin.create({
          color: "#000",
          showTime: true,
          followCursorY: 'true',
          opacity: '1',
        }),
      ],
    });

    const removeDetachedRegions = () => {
      const unbound = Object.values(wsi.regions.list).filter((reg: any) => {
        return !isDefined(reg._region);
      });

      unbound.forEach(reg => reg.remove());

    };

    wsi.on("ready", () => {
      onLoaded(false);

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

          if (!region) {
            removeDetachedRegions();

            reg.on('update-end', () => {
              const newReg = wsi.addRegion({
                start: reg.start,
                end: reg.end,
                resize: false,
              });

              newReg.on("click", () => newReg.remove());

              newReg.playLoop();
            });
            return;
          }

          reg._region = region;
          reg.color = region.selectedregionbg;

          reg.on("click", (e: MouseEvent) => {
            region.onClick(wsi, e);
          });

          reg.on("dblclick", (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            window.setTimeout(function() {
              reg.playLoop();
            }, 0);
          });

          reg.on("update-end", () => {
            region.onUpdateEnd(wsi);
          });

          reg.on("out", () => {});
        });
      }

      onReady?.({
        duration: wsi.getDuration(),
        surfer: wsi,
      });
    });

    wsi.setPlaybackRate(speed);

    wsi.zoom(ZOOM_X.default);

    wsi.on("scroll", (e) => onScroll(e.target.scrollLeft));

    wsi.on("play", () => onPlayToggle?.(true));

    wsi.on("pause", () => onPlayToggle?.(false));

    wsi.on("finish", () => onPlayFinished?.());

    wsi.on('zoom', (minPxPerMinute) => onZoom?.(minPxPerMinute));

    wsi.on("seek", (progress) => {
      removeDetachedRegions();
      onSeek((wsi.getDuration() * progress) * 1000);
    });

    wsi.on("loading", (progress) => {
      onProgress(progress);
    });

    wsi.load(data._value);

    ws.current = wsi;

    Object.assign(window, { surfer: wsi });

    return () => {
      Object.entries(wsi.getActivePlugins()).forEach(([name, active]) => {
        if (active) wsi.destroyPlugin(name);
      });
      wsi.destroy();
    };
  }, []);

  return ws;
};

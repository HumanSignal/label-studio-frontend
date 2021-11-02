import { forwardRef, LegacyRef, MouseEvent, useCallback, useEffect, useMemo, useRef, useState, WheelEvent } from "react";
import { Block, Elem } from "../../utils/bem";
import { clamp, isDefined } from "../../utils/utilities";
import "./VideoCanvas.styl";

type VideoProps = {
  src: string,
  width?: number,
  height?: number,
  position?: number,
  currentTime?: number,
  playing?: boolean,
  framerate?: number,
  muted?: boolean,
  zoom?: number,
  pan?: PanOptions,
  allowInteractions?: boolean,

  contrast?: number,
  brightness?: number,
  saturation?: number,

  onClick?: () => void,
  onLoad?: (data: VideoRef) => void,
  onFrameChange?: (frame: number, length: number) => void,
}

type PanOptions = {
  x: number,
  y: number,
}

// @todo not in use; move all the zoom handling up the callstack
const zoomSteps = [0.25, 0.5, 0.75, 1, 1.5, 2, 5, 10, 16];

const clampZoom = (value: number) => clamp(value, zoomSteps[0], zoomSteps[zoomSteps.length - 1]);

const zoomRatio = (
  canvasWidth: number,
  canvasHeight: number,
  width: number,
  height: number,
) => Math.min(1, Math.min((canvasWidth / width), (canvasHeight / height)));

export interface VideoRef {
  currentFrame: number;
  length: number;
  playing: boolean;
  width: number;
  height: number;
  zoom: number;
  pan: PanOptions;
  volume: number;
  currentTime: number;
  videoDimensions: {
    width: number,
    height: number,
    ratio: number,
  };
  play: () => void;
  pause: () => void;
  goToFrame: (frame: number) => void;
  seek: (time: number) => void;
  setContrast: (value: number) => void;
  setBrightness: (value: number) => void;
  setSaturation: (value: number) => void;
  setZoom: (value: number) => void;
  setPan: (x: number, y: number) => void;
  readonly duration: number;
}

export const VideoCanvas = forwardRef<VideoRef, VideoProps>((props, ref) => {
  const raf = useRef<number>();
  const rootRef = useRef<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>();
  const contextRef = useRef<CanvasRenderingContext2D | null>();
  const videoRef = useRef<HTMLVideoElement>();

  const canvasWidth = useMemo(() => props.width ?? 600, [props.width]);
  const canvasHeight = useMemo(() => props.height ?? 600, [props.height]);

  const [minZoom, maxZoom] = [zoomSteps[0], zoomSteps[zoomSteps.length - 1]];

  const framerate = props.framerate ?? 29.97;
  const [loading, setLoading] = useState(true);
  const [length, setLength] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(props.position ?? 1);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanOptions>({ x: 0, y: 0 });

  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0, ratio: 1 });

  const [contrast, setContrast] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [saturation, setSaturation] = useState(1);

  const filters = useMemo(() => {
    const result: string[] = [];

    if (contrast !== 1) result.push(`contrast(${contrast})`);
    if (brightness !== 1) result.push(`brightness(${brightness})`);
    if (saturation !== 1) result.push(`saturate(${saturation})`);

    return result.join(" ");
  }, [brightness, contrast, saturation]);

  const drawVideo = () => {
    try {
      if (contextRef.current && videoRef.current) {
        const context = contextRef.current;
        const { width, height } = videoDimensions;

        if (width === 0 && height === 0) return;

        const resultWidth = width * zoom;
        const resultHeight = height * zoom;

        const offsetLeft = ((canvasWidth - resultWidth) / 2) + pan.x;
        const offsetTop = ((canvasHeight - resultHeight) / 2) + pan.y;

        context.clearRect(0, 0, canvasWidth, canvasHeight);

        context.save();
        context.filter = filters;
        context.drawImage(videoRef.current,
          0, 0, width, height,
          offsetLeft, offsetTop, resultWidth, resultHeight,
        );
        context.restore();
      }
    } catch(e) {
      console.log('Error rendering video', e);
    }
  };

  const updateFrame = useCallback((force = false) => {
    if (buffering && force !== true) return;

    const frame = Math.ceil((videoRef.current?.currentTime ?? 0) * framerate);
    const onChange = props.onFrameChange ?? (() => {});

    if (frame !== currentFrame || force === true) {
      setCurrentFrame(frame);
      drawVideo();
      onChange(frame, length);
    }
  }, [buffering, framerate, currentFrame, drawVideo, props.onFrameChange, length]);

  const handleZoom = useCallback((e: WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY * 0.01;
    const newZoom = clampZoom(zoom + delta);

    setZoom(newZoom);
  }, [maxZoom, minZoom, zoom]);

  const handlePan = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const startX = e.pageX;
    const startY = e.pageY;

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const position: PanOptions = {
        x: pan.x + (e.pageX - startX),
        y: pan.y + (e.pageY - startY),
      };

      setPan(position);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [pan.x, pan.y]);

  useEffect(() => {
    if (!playing) {
      drawVideo();
    }
  }, [drawVideo, playing]);

  useEffect(() => {

    const step = () => {
      updateFrame();

      if (playing) {
        raf.current = requestAnimationFrame(step);
      } else {
        cancelAnimationFrame(raf.current!);
      }
    };

    if (playing) raf.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf.current!);
    };
  }, [playing, updateFrame]);

  // Handle extrnal state change [position]
  useEffect(() => {
    if (videoRef.current && props.position) {
      videoRef.current.currentTime = props.position / framerate;
    }
  }, [framerate, props.position]);

  // Handle extrnal state change [current time]
  useEffect(() => {
    if (videoRef.current && props.currentTime) {
      videoRef.current.currentTime = props.currentTime;
    }
  }, [props.currentTime]);

  // Handle extrnal state change [play/pause]
  useEffect(() => {
    if (videoRef.current) {
      if (props.playing && !playing) {
        videoRef.current.play();
      } else if (props.playing === false && playing) {
        videoRef.current.pause();
      }
    }
  }, [playing, props.playing]);

  useEffect(() => {
    if (!props.allowInteractions) return;
    rootRef.current?.addEventListener("wheel", (e) => {
      e.preventDefault();
    });
  }, []);

  useEffect(() => {
    if (isDefined(props.zoom)) {
      setZoom(clampZoom(props.zoom));
    }
  }, [props.zoom]);

  useEffect(() => {
    if (isDefined(props.pan)) {
      setPan(props.pan);
    }
  }, [props.pan]);

  useEffect(() => {
    if (isDefined(props.brightness)){
      setBrightness(props.brightness);
    }
  }, [props.brightness]);

  useEffect(() => {
    if (isDefined(props.contrast)){
      setContrast(props.contrast);
    }
  }, [props.contrast]);

  useEffect(() => {
    if (isDefined(props.saturation)){
      setSaturation(props.saturation);
    }
  }, [props.saturation]);

  useEffect(() => {
    drawVideo();
  }, [filters]);

  const refSource: VideoRef = {
    currentFrame,
    length,
    playing,
    zoom,
    pan,
    videoDimensions,
    width: canvasWidth,
    height: canvasHeight,
    set currentTime(time: number) {
      const video = videoRef.current;

      if (video) {
        video.currentTime = time;
      }
    },
    get currentTime() {
      return videoRef.current?.currentTime ?? 0;
    },
    get duration() {
      return videoRef.current?.duration ?? 0;
    },
    get volume() {
      return videoRef.current?.volume ?? 1;
    },
    set volume(value: number) {
      const video = videoRef.current;

      if (video) {
        video.currentTime = value;
      }
    },
    setZoom(value) {
      setZoom(clampZoom(value));
    },
    setPan(x, y) {
      setPan({ x, y });
    },
    setContrast(value) {
      setContrast(value);
    },
    setBrightness(value) {
      setBrightness(value);
    },
    setSaturation(value) {
      setSaturation(value);
    },
    play() {
      videoRef.current?.play();
    },
    pause() {
      videoRef.current?.pause();
    },
    seek(time) {
      const video = videoRef.current!;

      video.currentTime = clamp(time, 0, video.duration);
      setTimeout(() => drawVideo(), 100);
    },
    goToFrame(frame: number) {
      const video = videoRef.current!;
      const frameClamped = clamp(frame, 1, length);

      video.currentTime = frameClamped / framerate;
      setTimeout(() => drawVideo(), 100);
    },
  };

  if (ref instanceof Function) {
    ref(refSource);
  } else if (ref) {
    ref.current = refSource;
  }

  useEffect(() => {
    const { width, height } = videoDimensions;
    const ratio = zoomRatio(canvasWidth, canvasHeight, width, height);

    if (videoDimensions.ratio !== ratio) {
      setVideoDimensions({ ...videoDimensions, ratio });
      setZoom(ratio);
    }
  }, [canvasWidth, canvasHeight, videoDimensions]);

  useEffect(() => {
    let isLoaded = false;

    const checkVideoLoaded = () => {
      if (isLoaded) return;

      if (videoRef.current?.readyState === 4) {
        isLoaded = true;
        const video = videoRef.current;

        setTimeout(() => {
          const length = Math.ceil(video.duration * framerate);
          const [width, height] = [video.videoWidth, video.videoHeight];

          const dimensions = {
            width,
            height,
            ratio: zoomRatio(canvasWidth, canvasHeight, width, height),
          };

          setVideoDimensions(dimensions);
          setLength(length);
          setLoading(false);
          updateFrame(true);

          props.onLoad?.({
            ...refSource,
            videoDimensions: dimensions,
            length,
          });
        }, 200);
        return;
      }

      setTimeout(checkVideoLoaded, 10);
    };

    checkVideoLoaded();
  }, []);

  const delayedUpdate = () => {
    const video = videoRef.current;

    if (video && video.networkState === video.NETWORK_IDLE) {
      if (!playing) updateFrame(true);
      setBuffering(false);
    } else {
      setBuffering(true);
    }
  };

  return (
    <Block ref={rootRef} name="video-canvas">
      {loading && (
        <Elem name="loading">
          <Block name="spinner"/>
        </Elem>
      )}
      <Elem
        name="view"
        onWheel={props.allowInteractions ? handleZoom : undefined}
        onMouseDown={props.allowInteractions ? handlePan : undefined}
        onClick={props.onClick}
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <canvas
          ref={(instance) => {
            if (instance) {
              canvasRef.current = instance;
              contextRef.current = instance.getContext('2d');
            }
          }}
          width={canvasWidth}
          height={canvasHeight}
          style={{ background: "#efefef" }}
        />
        {!loading && buffering && (
          <Elem name="buffering"/>
        )}
      </Elem>

      <video
        controls={false}
        src={props.src}
        preload="auto"
        style={{ width: 0, position: 'absolute' }}
        ref={videoRef as LegacyRef<HTMLVideoElement>}
        muted={props.muted ?? false}
        onPlay={() => {
          setPlaying(true);
          setBuffering(false);
        }}
        onPause={() => {
          setPlaying(false);
          setBuffering(false);
        }}
        onLoadedData={delayedUpdate}
        onCanPlay={delayedUpdate}
        onSeeked={delayedUpdate}
        onSeeking={delayedUpdate}
        onTimeUpdate={delayedUpdate}
        onProgress={delayedUpdate}
        onPlaying={() => {
          setBuffering(false);
          delayedUpdate();
        }}
        onWaiting={() => {
          setBuffering(true);
        }}
      />
    </Block>
  );
});

VideoCanvas.displayName = "VideoCanvas";

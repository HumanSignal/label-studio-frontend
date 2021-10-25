import { tSMethodSignature } from "@babel/types";
import { forwardRef, LegacyRef, MouseEvent, useCallback, useEffect, useRef, useState, WheelEvent } from "react";
import { Block, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
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

  contrast?: number,
  brightness?: number,
  saturation?: number,

  onLoad?: (data: VideoRef) => void,
  onFrameChange?: (frame: number, length: number) => void,
}

type PanOptions = {
  x: number,
  y: number,
}

const zoomSteps = [0.25, 0.5, 0.75, 1, 1.5, 2, 5, 10, 16];

export interface VideoRef {
  currentFrame: number;
  length: number;
  playing: boolean;
  width: number;
  height: number;
  play: () => void;
  pause: () => void;
  goToFrame: (frame: number) => void;
  seek: (time: number) => void;
  setContrast: (value: number) => void;
  setBrightness: (value: number) => void;
  setSaturation: (value: number) => void;
  setZoom: (value: number) => void;
  setPan: (x: number, y: number) => void;
  set currentTime(time: number);
  get currentTime(): number;
  set volume(value: number);
  get volume(): number;
  readonly duration: number;
}

export const VideoCanvas = forwardRef<VideoRef, VideoProps>((props, ref) => {
  const raf = useRef<number>();
  const rootRef = useRef<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>();
  const contextRef = useRef<CanvasRenderingContext2D | null>();
  const videoRef = useRef<HTMLVideoElement>();

  const canvasWidth = props.width ?? 600;
  const canvasHeight = props.height ?? 600;

  const [minZoom, maxZoom] = [zoomSteps[0], zoomSteps[zoomSteps.length - 1]];

  const framerate = props.framerate ?? 29.97;
  const [loading, setLoading] = useState(true);
  const [length, setLength] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(props.position ?? 1);
  const [size, setSize] = useState([0,0]);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanOptions>({ x: 0, y: 0 });

  const [contrast, setContrast] = useState(1);
  const [brightness, setBrightness] = useState(1.5);
  const [saturation, setSaturation] = useState(1.5);

  const drawVideo = useCallback((zoom: number, pan: PanOptions) => {
    if (canvasRef.current && contextRef.current && videoRef.current) {
      const [canvas, context] = [canvasRef.current, contextRef.current];
      const { width, height } = canvas;
      const ratio = Math.min(1, Math.min((width / size[0]), (height / size[1])));

      const resultWidth = (size[0] * ratio) * zoom;
      const resultHeight = (size[1] * ratio) * zoom;

      const offsetLeft = ((width - resultWidth) / 2) + pan.x;
      const offsetTop = ((height - resultHeight) / 2) + pan.y;

      context.clearRect(0, 0, width, height);

      context.save();
      context.filter = `contrast(${contrast}) brightness(${brightness}) saturate(${saturation})`;
      context.drawImage(videoRef.current,
        0, 0, size[0], size[1],
        offsetLeft, offsetTop, resultWidth, resultHeight,
      );
      context.restore();
    } else {
      console.log('nothing to render', [canvasRef.current, contextRef.current, videoRef.current]);
    }
  }, [size, brightness, contrast, saturation]);

  const updateFrame = useCallback((force = false) => {
    if (buffering && force === false) return;

    const frame = Math.ceil((videoRef.current?.currentTime ?? 0) * framerate);
    const onChange = props.onFrameChange ?? (() => {});

    if (frame !== currentFrame) {
      drawVideo(zoom, pan);
      setCurrentFrame(frame);
      onChange(frame, length);
    }
  }, [buffering, framerate, currentFrame, zoom, pan, drawVideo, props.onFrameChange, length]);

  const handleZoom = useCallback((e: WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY * 0.01;
    const newZoom = Math.max(minZoom, Math.min(zoom + delta, maxZoom));

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
      drawVideo(zoom, pan);
    }
  }, [zoom, pan, drawVideo, playing]);

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
      videoRef.current.currentTime = props.position * framerate;
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
    rootRef.current?.addEventListener("wheel", (e) => {
      e.preventDefault();
    });
  }, []);

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

  const refSource: VideoRef = {
    currentFrame,
    length,
    playing,
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
      setZoom(Math.max(zoomSteps[0], Math.min(value, zoomSteps[zoomSteps.length - 1])));
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

      video.currentTime = Math.max(0, Math.min(time, video.duration));
    },
    goToFrame(frame: number) {
      const video = videoRef.current!;
      const frameClamped = Math.max(1, Math.min(frame, length));

      video.currentTime = frameClamped / framerate;
      setTimeout(() => updateFrame(true), 100);
    },
  };

  if (ref instanceof Function) {
    ref(refSource);
  } else if (ref) {
    ref.current = refSource;
  }

  return (
    <Block ref={rootRef} name="video-canvas">
      {loading && (
        <Elem name="loading">
          <Block name="spinner"/>
        </Elem>
      )}
      <Elem
        name="view"
        onWheel={handleZoom}
        onMouseDown={handlePan}
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
      </Elem>

      <video
        controls={false}
        src={props.src}
        preload="metadata"
        style={{ width: 0, position: 'absolute' }}
        ref={videoRef as LegacyRef<HTMLVideoElement>}
        muted={props.muted ?? false}
        onLoadedData={() => {
          setTimeout(updateFrame, 100);
          setLoading(false);
          drawVideo(zoom, pan);
        }}
        onLoadedMetadata={(e) => {
          const video = e.target as HTMLVideoElement;
          const length = Math.ceil(video.duration * framerate);
          const size = [video.videoWidth, video.videoHeight];

          setLength(length);
          setSize(size);
          props.onLoad?.({
            ...refSource,
            length,
          });
        }}
        onPlay={() => {
          setPlaying(true);
          setBuffering(false);
        }}
        onPause={() => {
          setPlaying(false);
          setBuffering(false);
        }}
        onCanPlay={() => updateFrame(true)}
        onSeeked={() => updateFrame(true)}
        onSeeking={() => updateFrame(true)}
        onTimeUpdate={() => updateFrame(true)}
        onPlaying={() => setBuffering(false)}
        onWaiting={() => setBuffering(true)}
      />
    </Block>
  );
});

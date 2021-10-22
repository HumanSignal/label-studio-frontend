import React, { useEffect, useRef, useState } from "react";

import { IconPlayerPause, IconPlayerPlay, IconPlayerStep } from "../../../assets/icons";
import { ErrorMessage } from "../../../components/ErrorMessage/ErrorMessage";
import ObjectTag from "../../../components/Tags/Object";
import { Timeline } from "../../../components/Timeline/Timeline";
import { Hotkey } from "../../../core/Hotkey";
import { Block, Elem } from "../../../utils/bem";
import { clamp } from "../../../utils/utilities";

import "./Video.styl";
import { VideoRegions } from "./VideoRegions";

const hotkeys = Hotkey("Video", "Video Annotation");

const PlayPause = ({ item, video }) => {
  const [paused, setPausedState] = useState(true);
  const setPaused = paused => {
    setPausedState(paused);
    paused ? item.triggerSyncPause() : item.triggerSyncPlay();
  };

  useEffect(() => {
    video.onplay = () => setPaused(false);
    video.onpause = () => setPaused(true);
  }, [video]);
  const onPlayPause = () => video.paused ? video.play() : video.pause();

  useEffect(() => {
    hotkeys.addNamed("video:playpause", e => {
      e.preventDefault();
      onPlayPause();
    });
    return () => hotkeys.removeNamed("video:playpause");
  }, [video]);

  return (
    <Hotkey.Tooltip name="video:playpause" placement="bottomLeft">
      <Elem name="play" onClick={onPlayPause}>
        {paused ? <IconPlayerPlay /> : <IconPlayerPause />}
      </Elem>
    </Hotkey.Tooltip>
  );
};

const FrameStep = ({ item, video }) => {
  const onForward = () => { video.pause(); item.setFrame(item.frame + 1); };
  const onBackward = () => { video.pause(); item.setFrame(item.frame - 1); };

  useEffect(() => {
    hotkeys.addNamed("video:frame-forward", e => {
      e.preventDefault();
      onForward();
    });
    hotkeys.addNamed("video:frame-backward", e => {
      e.preventDefault();
      onBackward();
    });
    return () => {
      hotkeys.removeNamed("video:frame-forward");
      hotkeys.removeNamed("video:frame-backward");
    };
  }, [video]);

  return (
    <>
      <Hotkey.Tooltip name="video:frame-backward" placement="bottomLeft">
        <Elem name="frame" onClick={onBackward}>
          <IconPlayerStep style={{ transform: "rotate(180deg)" }} />
        </Elem>
      </Hotkey.Tooltip>
      <Hotkey.Tooltip name="video:frame-forward" placement="bottomLeft">
        <Elem name="frame" onClick={onForward}>
          <IconPlayerStep />
        </Elem>
      </Hotkey.Tooltip>
    </>
  );
};

const Progress = ({ item, video }) => {
  const progressRef = useRef();
  const timeRef = useRef();

  useEffect(() => {
    video.ontimeupdate = () => {
      const percent = video.currentTime / video.duration;

      item.setOnlyFrame(video.currentTime / item.framerate);
      timeRef.current.style.left = (percent * 100) + "%";
    };

    video.onseeked = () => item.triggerSyncSeek(video.currentTime);
  }, [video]);

  const progress = video.currentTime / video.duration;
  const onSeek = e => {
    if (e.buttons & 1) {
      const bar = progressRef.current;
      const box = bar.getBoundingClientRect();
      const percent = (e.clientX - box.left) / bar.offsetWidth;

      video.currentTime = video.duration * percent;
    }
  };

  return (
    <Elem name="progress" onMouseMove={onSeek} onMouseDown={onSeek} ref={progressRef}>
      <Elem name="current-time" style={{ left: progress * 100 + "%" }} ref={timeRef} />
    </Elem>
  );
};

const Sound = () => null;

const Controls = ({ item, video }) => {
  if (!video) return null;

  return (
    <Elem name="controls">
      <PlayPause item={item} video={video} />
      <FrameStep item={item} video={video} />
      <Progress item={item} video={video} />
      <Sound />
    </Elem>
  );
};

function onPlayPause(e) {
  e.preventDefault();
  const video = e.target;

  video.paused ? video.play() : video.pause();
}

const HtxVideoView = ({ item }) => {
  if (!item._value) return null;
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [videoLength, setVideoLength] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const videoEl = item.ref.current;

    if (videoEl) {
      setMounted(true);
      if (videoEl.readyState === 4) setLoaded(true);
      else videoEl.addEventListener("loadedmetadata", () => {
        console.log("LOADED", videoEl.duration, item.framerate);
        setLoaded(true);
        setVideoLength(Math.ceil(videoEl.duration * item.frameRate));
      });
    }
  }, [item.ref.current]);

  useEffect(() => {
    const video = item.ref.current;

    if (video) {
      playing ? video.play() : video.pause();
    }
  }, [playing]);

  const regions = item.regs.map(reg => ({
    id: reg.id,
    label: "Possum",
    color: "#7F64FF",
    visible: true,
    selected: false,
    keyframes: reg.sequence.map(s => ({
      frame: s.frame,
      stop: false,
    })),
  }));

  console.log({ 'item.frame': item.frame, videoLength, fps: item.frameRate, item });

  return (
    <ObjectTag item={item}>
      {item.errors?.map((error, i) => (
        <ErrorMessage key={`err-${i}`} error={error} />
      ))}
      <Block name="video">
        {loaded && (
          <VideoRegions
            item={item}
            width={item.ref.current.offsetWidth}
            height={item.ref.current.offsetHeight}
          />
        )}
        <video src={item._value} ref={item.ref} onClick={onPlayPause} muted={item.muted} />
        <Controls item={item} video={mounted && item.ref.current} />
      </Block>
      <Timeline
        playing={playing}
        length={videoLength}
        position={clamp(Math.ceil(item.frame) + 1, 0, videoLength)}
        regions={regions}
        framerate={item.frameRate}
        onPositionChange={item.setFrame}
        onPlayToggle={setPlaying}
        onToggleVisibility={(id) => {
          // setRegions(regions.map(reg => {
          //   if (reg.id === id) {
          //     return { ...reg, visible: !reg.visible };
          //   }
          //   return reg;
          // }));
        }}
        onDeleteRegion={(id) => {
          // setRegions(regions.filter(reg => reg.id !== id));
        }}
        onSelectRegion={(_, id) => {
          // setRegions(regions.map(reg => {
          //   reg.selected = reg.id === id;
          //   return reg;
          // }));
        }}
      />
    </ObjectTag>
  );
};

export { HtxVideoView };

import React, { useEffect, useRef, useState } from "react";

import { IconPlayerPause, IconPlayerPlay, IconPlayerStep } from "../../../assets/icons";
import { ErrorMessage } from "../../../components/ErrorMessage/ErrorMessage";
import ObjectTag from "../../../components/Tags/Object";
import { Hotkey } from "../../../core/Hotkey";
import { Block, Elem } from "../../../utils/bem";

import "./Video.styl";

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
  const frameRate = +(item.framerate ?? 1 / 25);
  const onForward = () => { video.pause(); video.currentTime += frameRate; };
  const onBackward = () => { video.pause(); video.currentTime -= frameRate; };

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
      <Hotkey.Tooltip name="video:frame-backward" placement="bottomLeft">
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

  useEffect(() => {
    if (item.ref.current) setMounted(true);
  }, [item.ref.current]);

  return (
    <ObjectTag item={item}>
      {item.errors?.map((error, i) => (
        <ErrorMessage key={`err-${i}`} error={error} />
      ))}
      <Block name="video">
        <video src={item._value} ref={item.ref} onClick={onPlayPause} muted={item.muted} />
        <Controls item={item} video={mounted && item.ref.current} />
      </Block>
    </ObjectTag>
  );
};

export { HtxVideoView };

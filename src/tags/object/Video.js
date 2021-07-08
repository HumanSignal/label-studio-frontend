import { Tooltip } from "antd";
import { observer, inject } from "mobx-react";
import { types } from "mobx-state-tree";
import React, { useEffect, useRef, useState } from "react";

import { IconPlayerPause, IconPlayerPlay, IconPlayerStep } from "../../assets/icons";
import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import ObjectTag from "../../components/Tags/Object";
import { Hotkey } from "../../core/Hotkey";
import Registry from "../../core/Registry";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import { Elem, Block } from "../../utils/bem";
import ObjectBase from "./Base";

import "./Video/Video.styl";

const hotkeys = Hotkey();

/**
 * Video tag plays a simple video file.
 * @example
 * <View>
 *   <Video name="video" value="$video" />
 * </View>
 * @example
 * <!-- Video classification -->
 * <View>
 *   <Video name="video" value="$video" />
 *   <Choices name="ch" toName="video">
 *     <Choice value="Positive" />
 *     <Choice value="Negative" />
 *   </Choices>
 * </View>
 * @example
 * <!-- Video transcription -->
 * <View>
 *   <Video name="video" value="$video" />
 *   <TextArea name="ta" toName="video" />
 * </View>
 * @name Video
 * @param {string} name Name of the element
 * @param {string} value URL of the video
 */

const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  zoom: types.optional(types.boolean, false),
  volume: types.optional(types.boolean, false),
  speed: types.optional(types.boolean, false),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    type: "video",
    _value: types.optional(types.string, ""),
    playing: types.optional(types.boolean, false),
    height: types.optional(types.string, "20"),
  })
  .volatile(self => ({
    errors: [],
    ref: React.createRef(),
  }))
  .actions(self => ({
    handlePlay() {
      self.playing = !self.playing;
    },

    onHotKey() {
      self._ws.playPause();
      return false;
    },

    onLoad(ws) {
      self._ws = ws;
    },

    onError(error) {
      self.errors = [error];
    },

    wsCreated(ws) {
      self._ws = ws;
    },
  }));

const VideoModel = types.compose("VideoModel", Model, TagAttrs, ProcessAttrsMixin, ObjectBase, AnnotationMixin);

const PlayPause = ({ video }) => {
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    video.onplay = () => setPaused(false);
    video.onpause = () => setPaused(true);
  }, [video]);
  const onPlayPause = () => video.paused ? video.play() : video.pause();

  useEffect(() => {
    hotkeys.addKey("alt+space", e => {
      e.preventDefault();
      onPlayPause();
    });
    return () => hotkeys.removeKey("alt+space");
  }, [video]);

  return (
    <Tooltip title="Play/Pause [alt+space]" placement="bottomLeft">
      <Elem name="play" onClick={onPlayPause}>
        {paused ? <IconPlayerPlay /> : <IconPlayerPause />}
      </Elem>
    </Tooltip>
  );
};

const FrameStep = ({ video }) => {
  const frameRate = 1 / 25;
  const onForward = () => { video.pause(); video.currentTime += frameRate; };
  const onBackward = () => { video.pause(); video.currentTime -= frameRate; };

  useEffect(() => {
    hotkeys.addKey("alt+right", e => {
      e.preventDefault();
      onForward();
    });
    hotkeys.addKey("alt+left", e => {
      e.preventDefault();
      onBackward();
    });
    return () => {
      hotkeys.removeKey("alt+right");
      hotkeys.removeKey("alt+left");
    };
  }, [video]);

  return (
    <>
      <Tooltip title="One Frame Back [alt+left]" placement="bottomLeft">
        <Elem name="frame" onClick={onBackward}>
          <IconPlayerStep style={{ transform: "rotate(180deg)" }} />
        </Elem>
      </Tooltip>
      <Tooltip title="One Frame Forward [alt+right]" placement="bottomLeft">
        <Elem name="frame" onClick={onForward}>
          <IconPlayerStep />
        </Elem>
      </Tooltip>
    </>
  );
};

const Progress = ({ video }) => {
  const progressRef = useRef();
  const timeRef = useRef();
  useEffect(() => {
    video.ontimeupdate = () => {
      const percent = video.currentTime / video.duration;
      timeRef.current.style.left = (percent * 100) + "%";
    };
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
      <PlayPause video={video} />
      <FrameStep video={video} />
      <Progress video={video} />
      <Sound />
    </Elem>
  );
};

function onPlayPause(e) {
  e.preventDefault();
  const video = e.target;
  video.paused ? video.play() : video.pause();
}

const HtxVideoView = ({ store, item }) => {
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
        <video src={item._value} ref={item.ref} onClick={onPlayPause} />
        <Controls item={item} video={mounted && item.ref.current} />
      </Block>
    </ObjectTag>
  );
};

const HtxVideo = inject("store")(observer(HtxVideoView));

Registry.addTag("video", VideoModel, HtxVideo);
Registry.addObjectType(VideoModel);

export { VideoModel, HtxVideo };

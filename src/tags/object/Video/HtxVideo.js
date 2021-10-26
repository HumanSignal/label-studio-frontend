import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorMessage } from "../../../components/ErrorMessage/ErrorMessage";
import ObjectTag from "../../../components/Tags/Object";
import { Timeline } from "../../../components/Timeline/Timeline";
import { VideoCanvas } from "../../../components/VideoCanvas/VideoCanvas";
import { defaultStyle } from "../../../core/Constants";
import { Hotkey } from "../../../core/Hotkey";
import { Block } from "../../../utils/bem";
import { clamp } from "../../../utils/utilities";

import "./Video.styl";
import { VideoRegions } from "./VideoRegions";

// const hotkeys = Hotkey("Video", "Video Annotation");

const HtxVideoView = ({ item }) => {
  if (!item._value) return null;
  const root = useRef();
  const [loaded, setLoaded] = useState(false);
  const [videoLength, setVideoLength] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(1);

  const [videoSize, setVideoSize] = useState([0, 0]);
  const [zoom, setZoom] = useState();
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const block = root.current;

    if (block) {
      setVideoSize([
        block.clientWidth,
        block.clientHeight,
      ]);
    }
  }, []);

  useEffect(() => {
    const video = item.ref.current;

    if (video) {
      playing ? video.play() : video.pause();
    }
  }, [playing]);

  useEffect(() => {
    const cancelWheel = (e) => {
      if (!e.shiftKey) return;
      e.preventDefault();
    };

    root.current.addEventListener('wheel', cancelWheel);

    return () => root.current.removeEventListener('wheel', cancelWheel);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const block = root.current;

      if (block) {
        setVideoSize([
          block.clientWidth,
          block.clientHeight,
        ]);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleZoom = useCallback((e) => {
    if (!e.shiftKey) return;

    const delta = e.deltaY * 0.01;
    const video = item.ref.current;
    const newZoom = clamp(video.zoom + delta, 0.25, 16);

    setZoom(newZoom);
  }, []);

  const regions = item.regs.map(reg => {
    const color = reg.style?.fillcolor ?? reg.tag?.fillcolor ?? defaultStyle.fillcolor;
    const label = reg.labels.join(", ") || "Empty";
    const sequence = reg.sequence.map(s => ({
      frame: s.frame,
      enabled: s.enabled,
    }));

    return {
      id: reg.id,
      label,
      color,
      visible: !reg.hidden,
      selected: reg.selected,
      keyframes: sequence,
    };
  });

  return (
    <ObjectTag item={item}>
      {item.errors?.map((error, i) => (
        <ErrorMessage key={`err-${i}`} error={error} />
      ))}

      <Block ref={root} name="video" style={{ minHeight: 600 }} onWheel={handleZoom}>
        {loaded && (
          <VideoRegions
            item={item}
            zoom={zoom}
            pan={pan}
            regions={item.regs}
            width={videoSize[0]}
            height={videoSize[1]}
          />
        )}
        <VideoCanvas
          ref={item.ref}
          src={item._value}
          width={videoSize[0]}
          height={videoSize[1]}
          muted={item.muted}
          zoom={zoom}
          pan={pan}
          framerate={item.frameRate}
          onFrameChange={(position, length) => {
            setPosition(position);
            setVideoLength(length);
            item.setOnlyFrame(position);
          }}
          onLoad={({ length }) => {
            setLoaded(true);
            setVideoLength(length);
            item.setOnlyFrame(1);
          }}
        />
        {/* <video src={item._value} ref={item.ref} onClick={onPlayPause} muted={item.muted} /> */}
        {/* <Controls item={item} video={mounted && item.ref.current} /> */}
      </Block>
      {loaded && (
        <Timeline
          playing={playing}
          length={videoLength}
          position={position}
          regions={regions}
          framerate={item.frameRate}
          onPositionChange={item.setFrame}
          onPlayToggle={setPlaying}
          onToggleVisibility={(id) => {
            const reg = item.regs.find(reg => reg.pid === id || reg.id === id);

            reg?.toggleHidden();
          }}
          // onDeleteRegion={(id) => {
          //   // setRegions(regions.filter(reg => reg.id !== id));
          // }}
          onSelectRegion={(_, id) => {
            const reg = item.regs.find(reg => reg.pid === id || reg.id === id);

            reg?.onClickRegion();
          }}
          onAction={(_, action, data) => {
            switch(action) {
              case "lifespan_add": console.log(data.frame); break;
              case "lifespan_remove": console.log(data.frame); break;
              case "keyframe_add": console.log(data.frame); break;
              case "keyframe_remove": console.log(data.frame); break;
              default: console.log('unknown action');
            }
          }}
        />
      )}
    </ObjectTag>
  );
};

export { HtxVideoView };

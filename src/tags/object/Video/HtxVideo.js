import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../../common/Button/Button";
import { Dropdown } from "../../../common/Dropdown/Dropdown";
import { Menu } from "../../../common/Menu/Menu";
import { Space } from "../../../common/Space/Space";
import { ErrorMessage } from "../../../components/ErrorMessage/ErrorMessage";
import ObjectTag from "../../../components/Tags/Object";
import { Timeline } from "../../../components/Timeline/Timeline";
import { VideoCanvas } from "../../../components/VideoCanvas/VideoCanvas";
import { defaultStyle } from "../../../core/Constants";
import { Block, Elem } from "../../../utils/bem";
import { clamp, isDefined } from "../../../utils/utilities";

import "./Video.styl";
import { VideoRegions } from "./VideoRegions";

// const hotkeys = Hotkey("Video", "Video Annotation");

const HtxVideoView = ({ item }) => {
  if (!item._value) return null;
  const videoContainerRef = useRef();
  const [loaded, setLoaded] = useState(false);
  const [videoLength, setVideoLength] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(1);

  const [videoSize, setVideoSize] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0, ratio: 1 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const block = videoContainerRef.current;

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

    videoContainerRef.current.addEventListener('wheel', cancelWheel);

    return () => videoContainerRef.current.removeEventListener('wheel', cancelWheel);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const block = videoContainerRef.current;

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

  const zoomIn = useCallback(() => {
    setZoom(clamp(zoom + 0.1, 0.25, 16));
  }, [zoom]);

  const zoomOut = useCallback(() => {
    setZoom(clamp(zoom - 0.1, 0.25, 16));
  }, [zoom]);

  const zoomToFit = useCallback(() => {
    setZoom(item.ref.current.videoDimensions.ratio);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomToHundered = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  });

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
      sequence,
    };
  });

  return (
    <ObjectTag item={item}>
      <Block name="video-segmentation">
        {item.errors?.map((error, i) => (
          <ErrorMessage key={`err-${i}`} error={error} />
        ))}

        <Block name="video">
          <Elem tag={Space} name="controls" align="end" size="small">
            <Dropdown.Trigger
              content={(
                <Menu size="medium" closeDropdownOnItemClick={false}>
                  <Menu.Item onClick={zoomIn}>Zoom In</Menu.Item>
                  <Menu.Item onClick={zoomOut}>Zoom Out</Menu.Item>
                  <Menu.Item onClick={zoomToFit}>Zoom To Fit</Menu.Item>
                  <Menu.Item onClick={zoomToHundered}>Zoom 100%</Menu.Item>
                </Menu>
              )}
            >
              <Button size="small">
                Zoom {Math.round(zoom * 100)}%
              </Button>
            </Dropdown.Trigger>
          </Elem>
          <Elem
            name="main"
            ref={videoContainerRef}
            style={{ minHeight: 600 }}
            onWheel={handleZoom}
          >
            {videoSize && (
              <>
                {loaded && (
                  <VideoRegions
                    item={item}
                    zoom={zoom}
                    pan={pan}
                    regions={item.regs}
                    width={videoSize[0]}
                    height={videoSize[1]}
                    workingArea={videoDimensions}
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
                  framerate={item.framerate}
                  onFrameChange={(position, length) => {
                    setPosition(position);
                    setVideoLength(length);
                    item.setOnlyFrame(position);
                  }}
                  onLoad={({ length, videoDimensions }) => {
                    setLoaded(true);
                    setZoom(videoDimensions.ratio);
                    setVideoDimensions(videoDimensions);
                    setVideoLength(length);
                    item.setOnlyFrame(1);
                  }}
                />
              </>
            )}
            {/* <video src={item._value} ref={item.ref} onClick={onPlayPause} muted={item.muted} /> */}
            {/* <Controls item={item} video={mounted && item.ref.current} /> */}
          </Elem>
        </Block>
        {loaded && (
          <Timeline
            playing={playing}
            length={videoLength}
            position={position}
            regions={regions}
            framerate={item.framerate}
            onPositionChange={item.setFrame}
            onPlayToggle={setPlaying}
            onToggleVisibility={(id) => {
              item.findRegion(id)?.toggleHidden();
            }}
            onDeleteRegion={(id) => {
              item.deleteRegion(id);
            }}
            onSelectRegion={(_, id) => {
              item.findRegion(id)?.onClickRegion();
            }}
            onAction={(_, action, data) => {
              const region = item.regs.find(reg => reg.selected);

              if (isDefined(region)) {
                switch(action) {
                  case "lifespan_add":
                  case "lifespan_remove":
                    region.toggleLifespan(data.frame);
                    break;
                  case "keypoint_add":
                    region.addKeypoint(data.frame);
                    break;
                  case "keypoint_remove":
                    region.removeKeypoint(data.frame);
                    break;
                  default:
                    console.log('unknown action');
                }
              }
            }}
          />
        )}
      </Block>
    </ObjectTag>
  );
};

export { HtxVideoView };

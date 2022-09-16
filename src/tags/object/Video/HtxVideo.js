import { useMemo } from "react";
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
// import { Hotkey } from "../../../core/Hotkey";
import { Block, Elem } from "../../../utils/bem";
import { clamp, isDefined } from "../../../utils/utilities";
import { useToggle } from "../../../hooks/useToggle";

import "./Video.styl";
import { VideoRegions } from "./VideoRegions";
import ResizeObserver from "../../../utils/resize-observer";
import { useFullscreen } from "../../../hooks/useFullscreen";
import { IconZoomIn } from "../../../assets/icons";

// const hotkeys = Hotkey("Video", "Video Annotation");

const HtxVideoView = ({ item }) => {
  if (!item._value) return null;
  const videoBlockRef = useRef();
  const videoContainerRef = useRef();
  const mainContentRef = useRef();
  const [loaded, setLoaded] = useState(false);
  const [videoLength, _setVideoLength] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, _setPosition] = useState(1);

  const [videoSize, setVideoSize] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0, ratio: 1 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [isFullScreen, enterFullscreen, exitFullscren, handleFullscreenToggle] = useToggle(false);
  const fullscreen = useFullscreen({
    onEnterFullscreen() { enterFullscreen(); },
    onExitFullscreen() { exitFullscren(); },
  });

  const setPosition = useCallback((value) => {
    if (value !== position) {
      _setPosition(clamp(value, 1, videoLength));
    }
  }, [position, videoLength, playing]);

  const setVideoLength = useCallback((value) => {
    if (value !== videoLength) _setVideoLength(value);
  }, [videoLength]);

  const supportsRegions = useMemo(() => {
    const controlType = item.control()?.type;

    return controlType ? controlType.match("video") : false;
  }, [item]);

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
    const container = videoContainerRef.current;

    const cancelWheel = (e) => {
      if (!e.shiftKey) return;
      e.preventDefault();
    };

    container.addEventListener('wheel', cancelWheel);

    return () => container.removeEventListener('wheel', cancelWheel);
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

    const onKeyDown = (e) => {
      if (e.code.startsWith('Shift')) {
        e.preventDefault();

        if (!panMode) {
          setPanMode(true);

          const cancelPan = (e) => {
            if (e.code.startsWith('Shift')) {
              setPanMode(false);
              document.removeEventListener('keyup', cancelPan);
            }
          };

          document.addEventListener('keyup', cancelPan);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    const observer = new ResizeObserver(() => onResize());
    const [vContainer, vBlock] = [videoContainerRef.current, videoBlockRef.current];

    observer.observe(vContainer);
    observer.observe(vBlock);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      observer.unobserve(vContainer);
      observer.unobserve(vBlock);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const fullscreenElement = fullscreen.getElement();

    if (isFullScreen && !fullscreenElement) {
      fullscreen.enter(mainContentRef.current);
    } else if (!isFullScreen && fullscreenElement) {
      fullscreen.exit();
    }
  }, [isFullScreen]);

  const handleZoom = useCallback((e) => {
    if (!e.shiftKey) return;

    const delta = e.deltaY * 0.01;

    requestAnimationFrame(() => {
      setZoom(zoom => clamp(zoom + delta, 0.25, 16));
    });
  }, []);

  const handlePan = useCallback((e) => {
    if (!panMode) return;

    const startX = e.pageX;
    const startY = e.pageY;

    const onMouseMove = (e) => {
      const position = {
        x: pan.x + (e.pageX - startX),
        y: pan.y + (e.pageY - startY),
      };

      requestAnimationFrame(() => {
        setPan(position);
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [panMode, pan]);

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

  const zoomReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  });

  // VIDEO EVENT HANDLERS
  const handleFrameChange = useCallback((position, length) => {
    setPosition(position);
    setVideoLength(length);
    item.setOnlyFrame(position);
  }, [item, setPosition, setVideoLength]);

  const handleVideoLoad = useCallback(({ length, videoDimensions }) => {
    setLoaded(true);
    setZoom(videoDimensions.ratio);
    setVideoDimensions(videoDimensions);
    setVideoLength(length);
    item.setOnlyFrame(1);
    item.setLength(length);
    item.setReady(true);
  }, [item, setVideoLength]);

  const handleVideoResize = useCallback((videoDimensions) => {
    setVideoDimensions(videoDimensions);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setPlaying(false);
    setPosition(videoLength);
  }, [videoLength, setPosition, setPlaying]);

  // TIMELINE EVENT HANDLERS
  const handlePlay = useCallback(() => {
    setPlaying((playing) => {
      if (playing === false) {
        item.ref.current.play();
        item.triggerSyncPlay();
        return true;
      }
      return playing;
    });
  }, []);

  const handlePause = useCallback(() => {
    setPlaying((playing) => {
      if (playing === true) {
        item.ref.current.pause();
        item.triggerSyncPause();
        return false;
      }
      return playing;
    });
  }, []);


  const handleSelectRegion = useCallback((_, id, select) => {
    const region = item.findRegion(id);
    const selected = region?.selected || region?.inSelection;

    if (!region || (isDefined(select) && selected === select)) return;

    region.onClickRegion();
  }, [item]);

  const handleAction = useCallback((_, action, data) => {
    const regions = item.regs.filter(reg => reg.selected || reg.inSelection);

    regions.forEach(region => {
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
          console.warn('unknown action');
      }
    });
  }, [item.regs]);

  const handleTimelinePositionChange = useCallback((newPosition) => {
    if (position !== newPosition) {
      item.setFrame(newPosition);
      setPosition(newPosition);
    }
  }, [item, position]);

  useEffect(() => () => {
    item.ref.current = null;
  }, []);

  const regions = item.regs.map(reg => {
    const color = reg.style?.fillcolor ?? reg.tag?.fillcolor ?? defaultStyle.fillcolor;
    const label = reg.labels.join(", ") || "Empty";
    const sequence = reg.sequence.map(s => ({
      frame: s.frame,
      enabled: s.enabled,
    }));

    return {
      id: reg.cleanId,
      label,
      color,
      visible: !reg.hidden,
      selected: reg.selected || reg.inSelection,
      sequence,
    };
  });

  return (
    <ObjectTag item={item}>
      <Block name="video-segmentation" ref={mainContentRef} mod={{ fullscreen: isFullScreen }}>
        {item.errors?.map((error, i) => (
          <ErrorMessage key={`err-${i}`} error={error} />
        ))}

        <Block name="video" mod={{ fullscreen: isFullScreen }} ref={videoBlockRef}>
          <Elem
            name="main"
            ref={videoContainerRef}
            style={{ height: Number(item.height) }}
            onWheel={handleZoom}
            onMouseDown={handlePan}
          >
            {videoSize && (
              <>
                {loaded && supportsRegions && (
                  <VideoRegions
                    item={item}
                    zoom={zoom}
                    pan={pan}
                    locked={panMode}
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
                  speed={item.speed}
                  framerate={item.framerate}
                  allowInteractions={false}
                  onFrameChange={handleFrameChange}
                  onLoad={handleVideoLoad}
                  onResize={handleVideoResize}
                  // onClick={togglePlaying}
                  onEnded={handleVideoEnded}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeeked={item.handleSeek}
                />
              </>
            )}
          </Elem>
        </Block>
        {loaded && (
          <Elem
            name="timeline"
            tag={Timeline}
            playing={playing}
            length={videoLength}
            position={position}
            regions={regions}
            allowFullscreen={false}
            fullscreen={isFullScreen}
            defaultStepSize={16}
            disableView={!supportsRegions}
            framerate={item.framerate}
            controls={{ FramesControl: true }}
            customControls={[
              {
                position: "left",
                component: () => {
                  return (
                    <Dropdown.Trigger
                      inline={isFullScreen}
                      content={(
                        <Menu size="auto" closeDropdownOnItemClick={false}>
                          <Menu.Item onClick={zoomIn}>Zoom In</Menu.Item>
                          <Menu.Item onClick={zoomOut}>Zoom Out</Menu.Item>
                          <Menu.Item onClick={zoomToFit}>Zoom To Fit</Menu.Item>
                          <Menu.Item onClick={zoomReset}>Zoom 100%</Menu.Item>
                        </Menu>
                      )}
                    >
                      <Button size="small" nopadding><IconZoomIn/></Button>
                    </Dropdown.Trigger>
                  );
                },
              },
            ]}
            onPositionChange={handleTimelinePositionChange}
            onPlay={handlePlay}
            onPause={handlePause}
            onFullscreenToggle={handleFullscreenToggle}
            onSelectRegion={handleSelectRegion}
            onAction={handleAction}
          />
        )}
      </Block>
    </ObjectTag>
  );
};

export { HtxVideoView };

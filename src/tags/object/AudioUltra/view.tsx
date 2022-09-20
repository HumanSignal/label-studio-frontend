import { observer } from "mobx-react";
import { FC, useEffect, useRef } from "react";
import { useWaveform } from "../../../lib/AudioUltra/react";
import { Controls } from "../../../components/Timeline/Controls";
import { Region } from "../../../lib/AudioUltra/Regions/Region";
import { Segment } from "../../../lib/AudioUltra/Regions/Segment";

interface AudioUltraProps {
  item: any;
}

const AudioUltraView: FC<AudioUltraProps> = ({ item }) => {
  const rootRef = useRef<HTMLElement | null>();

  const { waveform, ...controls } = useWaveform(rootRef, {
    src: item._value,
    waveColor: "#BEB9C5",
    gridColor: "#BEB9C5",
    gridWidth: 1,
    backgroundColor: "#fafafa",
    autoCenter: true,
    zoomToCursor: true,
    enabledChannels: [0],
    height: 94,
    zoom: 1,
    rate: 1,
    muted: false,
    onLoad: item.onLoad,
    regions: {
      createable: !item.readonly,
      updateable: !item.readonly,
      deleteable: !item.readonly,
    },
    timeline: {
      backgroundColor: "#ffffff",
    },
  });

  useEffect(() => {
    const createRegion = (region: Region|Segment) => {
      item.addRegion(region);
    };

    waveform.current?.on("regionCreated", createRegion);

    return () => {
      waveform.current?.off("regionCreated", createRegion);
    };
  }, []);

  return (
    <div>
      <div ref={(el) => (rootRef.current = el)}></div>
      <Controls
        position={controls.currentTime}
        playing={controls.playing}
        volume={controls.volume}
        speed={controls.rate}
        zoom={controls.zoom}
        duration={controls.duration}
        onPlay={() => controls.setPlaying(true)}
        onPause={() => controls.setPlaying(false)}
        allowFullscreen={false}
        onVolumeChange={vol => controls.setVolume(vol)}
        onStepBackward={() => {}}
        onStepForward={() => {}}
        onRewind={(steps) => {}}
        onForward={(steps) => {}}
        onPositionChange={pos => controls.setCurrentTime(pos)}
        onSpeedChange={speed => controls.setRate(speed)}
        onZoom={zoom => controls.setZoom(zoom)}
        amp={controls.amp}
        onAmpChange={amp => controls.setAmp(amp)}
      />
    </div>
  );
};

export const AudioUltra = observer(AudioUltraView);

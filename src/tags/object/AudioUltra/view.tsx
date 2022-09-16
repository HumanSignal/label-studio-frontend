import { observer } from "mobx-react";
import { FC, useEffect, useRef } from "react";
import { useWaveform } from "../../../lib/AudioUltra/react";
import { Controls } from "../../../components/Timeline/Controls";
import { Region, RegionOptions } from "../../../lib/AudioUltra/Regions/Region";
import { Segment } from "../../../lib/AudioUltra/Regions/Segment";

interface AudioUltraProps {
  item: any;
}

const AudioUltraView: FC<AudioUltraProps> = ({ item }) => {
  const rootRef = useRef<HTMLElement | null>();
  const regions: RegionOptions[] = item.regions.map((region: any) => {
    console.log(region);
    return {
      start: region.start,
      end: region.end,
      color: region.color,
    };
  });

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
    muted: false,
    rate: 1,
    onLoad: item.onLoad,
    regions,
    timeline: {
      backgroundColor: "#ffffff",
    },
  });

  useEffect(() => {
    const createRegion = (region: Region|Segment) => {
      item.addRegion(region);
    };

    const updateRegion = (region: Region|Segment) => {
      // item.updateRegion(region);
    };

    waveform.current?.on("regionCreate", createRegion);
    waveform.current?.on("regionUpdate", updateRegion);

    return () => {
      waveform.current?.off("regionCreate", createRegion);
      waveform.current?.off("regionUpdate", updateRegion);
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

import { observer } from "mobx-react";
import { FC, useEffect, useRef } from "react";
import { useWaveform } from "../../../lib/AudioUltra/react";
import { Controls } from "../../../components/Timeline/Controls";
import { Region } from "../../../lib/AudioUltra/Regions/Region";
import { Segment } from "../../../lib/AudioUltra/Regions/Segment";
import { Regions } from "../../../lib/AudioUltra/Regions/Regions";

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
    experimental: {
      backgroundCompute: true,
      denoize: true,
    },
  });

  useEffect(() => {
    const updateBeforeRegionDraw = (regions: Regions) => {
      const regionColor = item.getRegionColor();

      if (regionColor) {
        regions.regionDrawableTarget();
        regions.setDrawingColor(regionColor);
      }
    };

    const updateAfterRegionDraw = (regions: Regions) => {
      regions.resetDrawableTarget();
      regions.resetDrawingColor();
    };

    const createRegion = (region: Region|Segment) => {
      item.addRegion(region);
    };

    const selectRegion = (region: Region|Segment) => {
      if (!region.selected || !region.isRegion) item.annotation.regionStore.unselectAll();

      // to select or unselect region
      item.annotation.regions.forEach((obj: any) => {
        if (obj.id === region.id) {
          obj.annotation.regionStore.toggleSelection(obj, region.selected);
        } else {
          obj.annotation.regionStore.toggleSelection(obj, false);
        }
      });

      // to select or unselect unlabeled segments
      item._ws.regions.regions.forEach((obj: any) => {
        if (!obj.isRegion) {
          if (obj.id === region.id) {
            obj.handleSelected(region.selected);
          } else {
            obj.handleSelected(false);
          }
        }
      });

    };

    const updateRegion = (region: Region|Segment) => {
      item.updateRegion(region);
    };

    waveform.current?.on("beforeRegionsDraw", updateBeforeRegionDraw);
    waveform.current?.on("afterRegionsDraw", updateAfterRegionDraw);
    waveform.current?.on("regionSelected", selectRegion);
    waveform.current?.on("regionCreated", createRegion);
    waveform.current?.on("regionUpdatedEnd", updateRegion);

    return () => {
      waveform.current?.off("beforeRegionsDraw", updateBeforeRegionDraw);
      waveform.current?.off("afterRegionsDraw", updateAfterRegionDraw);
      waveform.current?.off("regionSelected", selectRegion);
      waveform.current?.off("regionCreated", createRegion);
      waveform.current?.off("regionUpdatedEnd", updateRegion);
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

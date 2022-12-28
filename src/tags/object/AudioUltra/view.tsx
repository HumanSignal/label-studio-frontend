import { observer } from 'mobx-react';
import { FC, useEffect, useRef } from 'react';
import { Hotkey } from '../../../core/Hotkey';
import { useWaveform } from '../../../lib/AudioUltra/react';
import { Controls } from '../../../components/Timeline/Controls';
import { Region } from '../../../lib/AudioUltra/Regions/Region';
import { Segment } from '../../../lib/AudioUltra/Regions/Segment';
import { Regions } from '../../../lib/AudioUltra/Regions/Regions';
import { Block } from '../../../utils/bem';
import './view.styl';

interface AudioUltraProps {
  item: any;
}

const NORMALIZED_STEP = 0.1;

const AudioUltraView: FC<AudioUltraProps> = ({ item }) => {
  const rootRef = useRef<HTMLElement | null>();

  const { waveform, ...controls } = useWaveform(rootRef, 
    {
      src: item._value,
      autoLoad: false,
      waveColor: '#BEB9C5',
      gridColor: '#BEB9C5',
      gridWidth: 1,
      backgroundColor: '#fafafa',
      autoCenter: true,
      zoomToCursor: true,
      enabledChannels: [0],
      height: 94,
      volume: item.defaultvolume ? Number(item.defaultvolume) : 1,
      amp: item.defaultscale ? Number(item.defaultscale) : 1,
      zoom: item.defaultzoom ? Number(item.defaultzoom) : 1,
      rate: item.defaultspeed ? Number(item.defaultspeed) : 1,
      muted: item.muted === 'true',
      onLoad: item.onLoad,
      onPlaying: item.onPlaying,
      onSeek: item.onSeek,
      onRateChange: item.onRateChange,
      regions: {
        createable: !item.readonly,
        updateable: !item.readonly,
        deleteable: !item.readonly,
      },
      timeline: {
        backgroundColor: '#ffffff',
      },
      experimental: {
        backgroundCompute: true,
        denoize: true,
      },
      autoPlayNewSegments: true,
    },
  );

  useEffect(() => {
    if (item.annotationStore.store.hydrated) {
      const hotkeys = Hotkey('Audio', 'Audio Segmentation');

      waveform.current?.load();

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

      const selectRegion = (region: Region|Segment, event: MouseEvent) => {
        const growSelection = event.metaKey || event.ctrlKey;

        if (!growSelection || (!region.selected && !region.isRegion))
          item.annotation.regionStore.unselectAll();

        // to select or unselect region
        const itemRegion = item.regs.find((obj: any) => obj.id === region.id);

        itemRegion && item.annotation.regionStore.toggleSelection(itemRegion, region.selected);

        // to select or unselect unlabeled segments
        const targetInWave = item._ws.regions.findRegion(region.id);

        if (targetInWave) {
          targetInWave.handleSelected(region.selected);
        }

        // deselect all other segments if not changing multiselection
        if (!growSelection) {
          item._ws.regions.regions.forEach((obj: any) => {
            if (obj.id !== region.id) {
              obj.handleSelected(false);
            }
          });
        }
      };

      const updateRegion = (region: Region|Segment) => {
        item.updateRegion(region);
      };

      waveform.current?.on('beforeRegionsDraw', updateBeforeRegionDraw);
      waveform.current?.on('afterRegionsDraw', updateAfterRegionDraw);
      waveform.current?.on('regionSelected', selectRegion);
      waveform.current?.on('regionCreated', createRegion);
      waveform.current?.on('regionUpdatedEnd', updateRegion);

      hotkeys.addNamed('region:delete', () => {
        waveform.current?.regions.clearSegments(false);
      });

      hotkeys.addNamed('region:delete-all', () => {
        waveform.current?.regions.clearSegments();
      });

      return () => {
        hotkeys.unbindAll();
      };
    }
  }, [item.annotationStore.store.hydrated]);

  return (
    <Block name="audio-tag">
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
        onStepBackward={() => {
          waveform.current?.seekBackward(NORMALIZED_STEP);
          waveform.current?.syncCursor();
        }}
        onStepForward={() => {
          waveform.current?.seekForward(NORMALIZED_STEP);
          waveform.current?.syncCursor();
        }}
        onPositionChange={pos => controls.setCurrentTime(pos)}
        onSpeedChange={speed => controls.setRate(speed)}
        onZoom={zoom => controls.setZoom(zoom)}
        amp={controls.amp}
        onAmpChange={amp => controls.setAmp(amp)}
        mediaType="audio"
        toggleVisibility={(layerName: string, isVisible: boolean) => {
          if (waveform.current) {
            const layer = waveform.current?.getLayer(layerName);

            if (layer) {
              layer.setVisibility(isVisible);
            }
          }
        }}
        layerVisibility={controls.layerVisibility}
      />
    </Block>
  );
};

export const AudioUltra = observer(AudioUltraView);

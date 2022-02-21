import { observer } from "mobx-react";
import { FC, useCallback, useState } from "react";
import { ObjectTag } from "../../../components/Tags/Object";
import { Timeline } from "../../../components/Timeline/Timeline";
import { Elem } from "../../../utils/bem";

interface AudioNextProps {
  item: any;
}

const AudioNextView: FC<AudioNextProps> = ({ item }) => {
  const [playing, _setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [audioLength, setAudioLength] = useState(0);

  const [zoom, setZoom] = useState(Number(item.zoom));
  const [volume, setVolume] = useState(Number(item.volume));
  const [speed, setSpeed] = useState(Number(item.speed));

  const setPlaying = useCallback((playing) => {
    _setPlaying(playing);
    if (playing) item.triggerSyncPlay();
    else item.triggerSyncPause();
  }, [item]);

  const handleReady = useCallback((data: any) => {
    setAudioLength(data.duration * 1000);
    item.onLoad(data.surfer);
  }, []);

  const handlePositionChange = useCallback((frame: number) => setPosition(frame), []);
  const handlePlayToggle = useCallback((playing: boolean) => setPlaying(playing), []);
  const formatPosition = useCallback((pos: number, fps: number): string => {
    const roundedFps = Math.floor(fps);
    const value = Math.floor(pos % roundedFps);
    const result = Math.floor(value > 0 ? value : roundedFps);

    return result.toString().padStart(3, '0');
  }, []);

  return (
    <ObjectTag item={item}>
      <Elem
        mode="wave"
        name="timeline"
        tag={Timeline}
        framerate={1000}
        hopSize={1000}
        playing={playing}
        regions={item.regions}
        data={item}
        zoom={zoom}
        speed={speed}
        volume={volume}
        controls={{ VolumeControl: true }}
        defaultStepSize={16}
        length={audioLength}
        position={position}
        allowSeek={false}
        allowFullscreen={false}
        allowViewCollapse={false}
        controlsOnTop={false}
        onReady={handleReady}
        onAddRegion={item.addRegion}
        onSelectRegion={item.selectRegion}
        onPositionChange={handlePositionChange}
        onPlayToggle={handlePlayToggle}
        onZoom={setZoom}
        onVolumeChange={setVolume}
        onSpeedChange={setSpeed}
        formatPosition={formatPosition}
      />
    </ObjectTag>
  );
};

export const AudioNext = observer(AudioNextView);

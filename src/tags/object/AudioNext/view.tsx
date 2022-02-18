import { observer } from "mobx-react";
import { FC, useCallback, useState } from "react";
import { Timeline } from "../../../components/Timeline/Timeline";
import { Elem } from "../../../utils/bem";

interface AudioNextProps {
  item: any;
}

const AudioNextView: FC<AudioNextProps> = ({ item }) => {
  const [playing, setPlaying] = useState(false);
  const [audioLength, setAudioLength] = useState(1000 * 120);
  const [position, setPosition] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [volume, setVolume] = useState(1);

  const handleReady = useCallback((data: any) => {
    setAudioLength(data.duration * 1000);
    item.onLoad(data.surfer);
  }, []);
  const handlePositionChange = useCallback((frame: number) => setPosition(frame), []);
  const handlePlayToggle = useCallback((playing: boolean) => setPlaying(playing), []);
  const handleAction = () => {};

  return (
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
      volume={volume}
      controls={{ VolumeControl: true }}
      defaultStepSize={16}
      length={audioLength}
      position={position}
      allowFullscreen={false}
      displaySeeker={false}
      allowViewCollapse={false}
      controlsOnTop={false}
      onReady={handleReady}
      onAddRegion={item.addRegion}
      onSelectRegion={item.selectRegion}
      onPositionChange={handlePositionChange}
      onPlayToggle={handlePlayToggle}
      onAction={handleAction}
      onZoom={setZoom}
      onVolumeChange={setVolume}
    />
  );
};

export const AudioNext = observer(AudioNextView);

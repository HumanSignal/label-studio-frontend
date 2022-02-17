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

  const regions: any[] = [];

  const handleReady = useCallback((data: any) => setAudioLength(data.duration * 1000), []);
  const handlePositionChange = useCallback((frame: number) => setPosition(frame), []);
  const handlePlayToggle = useCallback((playing: boolean) => setPlaying(playing), []);
  const handleSelectRegion = () => {};
  const handleAction = () => {};

  return (
    <Elem
      mode="wave"
      name="timeline"
      tag={Timeline}
      framerate={999}
      hopSize={1000}
      playing={playing}
      regions={regions}
      data={item}
      defaultStepSize={16}
      length={audioLength}
      position={position}
      allowFullscreen={false}
      displaySeeker={false}
      allowViewCollapse={false}
      onReady={handleReady}
      onPositionChange={handlePositionChange}
      onPlayToggle={handlePlayToggle}
      onSelectRegion={handleSelectRegion}
      onAction={handleAction}
    />
  );
};

export const AudioNext = observer(AudioNextView);

import { observer } from "mobx-react";
import { FC, useState } from "react";
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

  const handlePlayToggle = () => {};
  const handleFullscreenToggle = () => {};
  const handleSelectRegion = () => {};
  const handleAction = () => {};

  return (
    <Elem
      mode="wave"
      name="timeline"
      tag={Timeline}
      framerate={1000}
      hopSize={1000}
      playing={playing}
      regions={regions}
      defaultStepSize={16}
      length={audioLength}
      position={position}
      allowFullscreen={false}
      displaySeeker={false}
      onPositionChange={(frame: number) => {
        setPosition(frame);
      }}
      onPlayToggle={handlePlayToggle}
      onFullscreenToggle={handleFullscreenToggle}
      onSelectRegion={handleSelectRegion}
      onAction={handleAction}
    />
  );
};

export const AudioNext = observer(AudioNextView);

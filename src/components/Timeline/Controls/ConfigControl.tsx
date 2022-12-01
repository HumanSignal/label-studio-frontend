import React, { FC, useState } from "react";
import { Block, Elem } from "../../../utils/bem";

import "./ConfigControl.styl";
import { IconConfig } from "../../../assets/icons/timeline";
import { ControlButton } from "../Controls";
import { Slider } from './Slider';

const MAX_SPEED = 2.5;
const MAX_ZOOM = 150;

export interface ConfigControlProps {
  configModal: boolean;
  speed: number;
  amp: number;
  onSetModal?: () => void;
  onSpeedChange: (speed: number) => void;
  onAmpChange: (amp: number) => void;
}

export const ConfigControl: FC<ConfigControlProps> = ({
  configModal,
  speed,
  amp,
  onSpeedChange,
  onSetModal,
  onAmpChange,
  ...props
}) => {
  const [playbackSpeed, setplaybackSpeed] = useState(speed ?? 1);
  const [isTimeline, setTimeline] = useState(true);
  const [isAudioWave, setAudioWave] = useState(true);
  const [isAudioTrack, setAudioTrack] = useState(true);

  const handleSetTimeline = () => {
    setTimeline(!isTimeline);
  };

  const handleSetAudioWave = () => {
    setAudioWave(!isAudioWave);
  };

  const handleSetAudioTrack = () => {
    setAudioTrack(!isAudioTrack);
  };

  const handleChangePlaybackSpeed = (e: React.FormEvent<HTMLInputElement>) => {
    const _playbackSpeed = parseFloat(e.currentTarget.value);

    setplaybackSpeed(_playbackSpeed);
    onSpeedChange(_playbackSpeed);
  };

  const handleChangeAmp = (e: React.FormEvent<HTMLInputElement>) => {
    const _amp = parseFloat(e.currentTarget.value);

    onAmpChange(_amp);
  };

  const renderMuteButton = () => {
    return (
      <Elem name={"buttons"}>
        <Elem
          name="menu-button"
          onClick={handleSetTimeline}
        >
          { isTimeline ? 'Show' : 'Hide' } timeline
        </Elem>
        <Elem
          name="menu-button"
          onClick={handleSetAudioWave}
        >
          { isAudioWave ? 'Show' : 'Hide' } audio wave
        </Elem>
        <Elem
          name="menu-button"
          onClick={handleSetAudioTrack}
        >
          { isAudioTrack ? 'Show' : 'Hide' } audio track
        </Elem>
      </Elem>
    );
  };

  const renderModal = () => {
    return (
      <Elem name="modal">
        <Slider
          min={0.5}
          max={MAX_SPEED}
          step={0.1}
          value={playbackSpeed}
          description={"Playback speed"}
          info={"Increase or decrease the playback speed"}
          onChange={handleChangePlaybackSpeed}
        />
        <Slider
          min={1}
          max={MAX_ZOOM}
          step={0.1}
          value={amp}
          description={"Audio zoom y-axis"}
          info={"Increase or decrease the appearance of amplitude"}
          onChange={handleChangeAmp}
        />
        {renderMuteButton()}
      </Elem>
    );
  };

  return (
    <Block name="audio-config">
      <ControlButton
        look={configModal ? 'active' : undefined}
        onClick={onSetModal}
      >
        {<IconConfig/>}
      </ControlButton>
      {configModal && renderModal()}
    </Block>
  );
};

import React, { FC, useState } from "react";
import { Block, Elem } from "../../../utils/bem";

import "./ConfigControl.styl";
import { IconConfig } from "../../../assets/icons/timeline";
import { ControlButton } from "../Controls";
import { Slider } from './Slider';

const MAX_SPEED = 250;
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
  const [playbackSpeed, setplaybackSpeed] = useState(100);
  const [isTimeline, setTimeline] = useState(true);
  const [isAudioWave, setAudioWave] = useState(true);
  const [isAudioTrack, setAudioTrack] = useState(true);

  const handleSetTimeline = () => {
    setTimeline(!isTimeline);

    console.log('hide/show timeline');
  };

  const handleSetAudioWave = () => {
    setAudioWave(!isAudioWave);

    console.log('hide/show audiowave');
  };

  const handleSetAudioTrack = () => {
    setAudioTrack(!isAudioTrack);

    console.log('hide/show audiotrack');
  };

  const handleChangePlaybackSpeed = (e: React.FormEvent<HTMLInputElement>) => {
    const _playbackSpeed = parseFloat(e.currentTarget.value);

    if (!_playbackSpeed) {
      setplaybackSpeed(0);
    } else {
      setplaybackSpeed(_playbackSpeed);
    }

    if (!_playbackSpeed || _playbackSpeed <= 20) {
      onSpeedChange(0.6);
    } else {
      onSpeedChange(_playbackSpeed / (MAX_SPEED / 2));
    }
  };

  const handleChangeAmp = (e: React.FormEvent<HTMLInputElement>) => {
    const _amp = parseFloat(e.currentTarget.value);

    onAmpChange(_amp * 10);
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
          min={50}
          max={MAX_SPEED}
          value={playbackSpeed}
          description={"Playback speed"}
          info={"Increase or decrease the playback speed"}
          onChange={handleChangePlaybackSpeed}
        />
        <Slider
          min={0}
          max={MAX_ZOOM}
          value={amp / 10}
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

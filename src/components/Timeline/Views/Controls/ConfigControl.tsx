import React, { FC, useEffect, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";

import "./ConfigControl.styl";
import { IconConfig } from "../../../../assets/icons/timeline";
import { ControlButton } from "../../Controls";
import { Slider } from './Slider';

const MAX_SPEED = 250;
const MAX_ZOOM = 150;

export interface ConfigControlProps {
  configModal: boolean;
  speed: number;
  zoom: number;
  onSetModal?: () => void;
  onSpeedChange: (speed: number) => void;
  onZoom: (zoom: number) => void;
}

export const ConfigControl: FC<ConfigControlProps> = ({
  configModal,
  speed,
  zoom,
  onSpeedChange,
  onSetModal,
  onZoom,
  ...props
}) => {
  const [playbackSpeed, setplaybackSpeed] = useState(100);
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

  const handleChangeZoom = (e: React.FormEvent<HTMLInputElement>) => {
    const _zoom = parseFloat(e.currentTarget.value);

    onZoom(_zoom * 10);
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
          value={zoom / 10}
          description={"Audio zoom y-axis"}
          info={"Increase or decrease the appearance of amplitude"}
          onChange={handleChangeZoom}
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

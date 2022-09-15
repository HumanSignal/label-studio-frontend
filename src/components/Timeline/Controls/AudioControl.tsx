import React, { FC, useEffect, useState } from "react";
import { Block, Elem } from "../../../utils/bem";

import "./AudioControl.styl";
import { IconSoundConfig, IconSoundMutedConfig } from "../../../assets/icons/timeline";
import { ControlButton } from "../Controls";
import { Slider } from './Slider';

const MAX_VOL = 200;

export interface AudioControlProps {
  volume: number;
  audioModal: boolean;
  onVolumeChange?: (volume: number) => void;
  onSetModal?: () => void;
}

export const AudioControl: FC<AudioControlProps> = ({
  volume,
  onVolumeChange,
  onSetModal,
  audioModal,
  ...props
}) => {
  const [isMuted, setMute] = useState(false);

  useEffect(() => {
    if (volume <= 0) {
      setMute(true);
    } else {
      setMute(false);
    }
  }, [volume]);

  const handleSetVolume = (e: React.FormEvent<HTMLInputElement>) => {
    const _volumeValue = parseInt(e.currentTarget.value);

    if (!_volumeValue) {
      onVolumeChange?.(0);
      return;
    }
    if (_volumeValue > MAX_VOL) {
      onVolumeChange?.(1);
      return;
    } else if (_volumeValue < 0) {
      onVolumeChange?.(0);
      return;
    }

    onVolumeChange?.(_volumeValue / MAX_VOL);
  };

  const handleSetMute = () => {
    setMute(!isMuted);
    onVolumeChange?.(!isMuted ? 0 : 1);
  };

  const renderModal = () => {
    return (
      <Elem name="modal">
        <Slider
          min={0}
          max={MAX_VOL}
          value={volume * MAX_VOL}
          onChange={handleSetVolume}
          description={"Volume"}
          info={"Increase or decrease the appearance of amplitude"}
        />
        {renderMuteButton()}
      </Elem>
    );
  };

  const renderMuteButton = () => {
    return (
      <Elem name={"mute"}>
        <Elem
          name="mute-button"
          onClick={handleSetMute}
        >
          { isMuted ? 'Unmute' : 'Mute' }
        </Elem>
      </Elem>
    );
  };

  return (
    <Block name="audio-control">
      <ControlButton
        look={audioModal ? 'active' : undefined}
        onClick={onSetModal}
      >
        {isMuted ? <IconSoundMutedConfig/> : <IconSoundConfig/>}
      </ControlButton>
      {audioModal && renderModal()}
    </Block>
  );
};

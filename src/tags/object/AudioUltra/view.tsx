import { observer } from "mobx-react";
import { FC, useCallback, useState } from "react";

interface AudioUltraViewProps {
  item: any;
}

const AudioUltraView: FC<AudioUltraViewProps> = ({ item }) => {

  const handleReady = useCallback(() => {
  }, []);

  const handlePositionChange = useCallback(() => {
  }, []);

  const handleSeek = useCallback(() => {
  }, []);

  const handleSpeed = useCallback(() => {
  }, []);

  const formatPosition = useCallback(() => {
  }, []);

  const handlePlay = useCallback(() => {
  }, []);

  const handlePause = useCallback(() => {
  }, []);

  return (
    <div>AudioUltra</div>
  );
};

export const AudioView = observer(AudioUltraView);

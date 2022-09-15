import { observer } from "mobx-react";
import { FC, useCallback } from "react";

interface AudioUltraProps {
  item: any;
}

const AudioUltraView: FC<AudioUltraProps> = () => {

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
    <>AudioUltra</>
  );
};

export const AudioUltra = observer(AudioUltraView);

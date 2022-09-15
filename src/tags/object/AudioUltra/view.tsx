import { observer } from "mobx-react";
import { FC, useCallback, useRef } from "react";
import { useWaveform } from "../../../lib/AudioUltra/react";

interface AudioUltraProps {
  item: any;
}

const AudioUltraView: FC<AudioUltraProps> = ({ item }) => {
  const rootRef = useRef<HTMLElement | null>();

  // const { waveform: _, ...controls } =
  useWaveform(rootRef, {
    src: item._value,
    waveColor: "#BEB9C5",
    gridColor: "#BEB9C5",
    gridWidth: 1,
    backgroundColor: "#ffffff",
    autoCenter: true,
    zoomToCursor: true,
    enabledChannels: [0],
    height: 94,
    zoom: 1,
    muted: false,
    rate: 1,
  });

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
    <div ref={(el) => (rootRef.current = el)}></div>
  );
};

export const AudioUltra = observer(AudioUltraView);

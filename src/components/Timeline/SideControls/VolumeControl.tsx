import { CSSProperties, FC, useMemo, useRef } from "react";
import { IconVolumeFull, IconVolumeHalf, IconVolumeMute } from "../../../assets/icons";
import { Range } from "../../../common/Range/Range";
import { TimelineSideControlProps } from "../Types";

export const VolumeControl: FC<TimelineSideControlProps> = ({
  volume = 0.5,
  onVolumeChange,
}) => {
  const storedVolume = useRef(volume);
  const style: CSSProperties = { color: "#99A0AE" };
  const icon = useMemo(() => {
    if (volume > 0.5) return <IconVolumeFull style={style}/>;
    else if (volume > 0) return <IconVolumeHalf style={style}/>;
    return <IconVolumeMute style={style}/>;
  }, [volume]);

  return (
    <Range
      continuous
      min={0}
      max={1}
      step={0.01}
      value={volume}
      minIcon={icon}
      onChange={volume => onVolumeChange?.(Number(volume))}
      onMinIconClick={() => {
        if (volume === 0) {
          onVolumeChange?.(storedVolume.current);
        } else {
          storedVolume.current = volume;
          onVolumeChange?.(0);
        }
      }}
    />
  );
};

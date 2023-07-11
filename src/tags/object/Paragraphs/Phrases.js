import { observer } from 'mobx-react';
import { getRoot } from 'mobx-state-tree';
import { Button } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import styles from './Paragraphs.module.scss';
import { FF_LSDV_E_278, isFF } from '../../../utils/feature-flags';
import { IconPause, IconPlay } from '../../../assets/icons';

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

export const Phrases = observer(({ item, playingId, activeRef }) => {
  const cls = item.layoutClasses;
  const withAudio = !!item.audio;

  if (!item._value) return null;

  const val = item._value.map((v, idx) => {
    const isPlaying = playingId === idx && item.playing;
    const style = (isFF(FF_LSDV_E_278) && !isPlaying) ? item.layoutStyles(v).inactive: item.layoutStyles(v);
    const classNames = [cls.phrase];
    const isContentVisible = item.isVisibleForAuthorFilter(v);
    const startTime = formatTime(item._value[idx]?.start);
    const endTime = formatTime(!item._value[idx]?.end ? item._value[idx]?.start + item._value[idx]?.duration : item._value[idx]?.end);

    console.log(playingId, idx, item.playing);

    if (withAudio) classNames.push(styles.withAudio);
    if (!isContentVisible) classNames.push(styles.collapsed);
    if (getRoot(item).settings.showLineNumbers) classNames.push(styles.numbered);

    return (
      <div key={`${item.name}-${idx}`} ref={isPlaying ? activeRef : null} data-testid={`phrase:${idx}`} className={`${classNames.join(' ')} ${isFF(FF_LSDV_E_278) && styles.newUI}`} style={style.phrase}>
        {isContentVisible && withAudio && !isNaN(v.start) && (
          <Button
            type="text"
            className={isFF(FF_LSDV_E_278) ? styles.playNewUi : styles.play}
            icon={isPlaying ?
              isFF(FF_LSDV_E_278) ?
                <IconPause /> : <PauseCircleOutlined /> :
              isFF(FF_LSDV_E_278) ?
                <IconPlay /> : <PlayCircleOutlined />
            }
            onClick={() => item.play(idx)}
          />
        )}
        <span className={styles.titleWrapper}>
          <span className={cls.name} data-skip-node="true" style={style.name}>{v[item.namekey]}</span>
          {isFF(FF_LSDV_E_278) && (
            <span className={styles.time}>{startTime} - {endTime}</span>
          )}
        </span>
        <span className={cls.text}>{v[item.textkey]}</span>
      </div>
    );
  });

  return val;
});

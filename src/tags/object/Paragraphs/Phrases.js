import { observer } from "mobx-react";
import { getRoot } from "mobx-state-tree";
import { Button } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import styles from "./Paragraphs.module.scss";

export const Phrases = observer(({ item }) => {
  const cls = item.layoutClasses;
  const withAudio = !!item.audio;

  if (!item._value) return null;

  const val = item._value.map((v, idx) => {
    const style = item.layoutStyles(v);
    const classNames = [styles.phrase];
    const isContentVisible = item.isVisibleForAuthorFilter(v);

    if (withAudio) classNames.push(styles.withAudio);
    if (!isContentVisible) classNames.push(styles.collapsed);
    if (getRoot(item).settings.showLineNumbers) classNames.push(styles.numbered);

    return (
      <div key={`${item.name}-${idx}`} className={classNames.join(" ")} style={style.phrase}>
        {isContentVisible && withAudio && !isNaN(v.start) && (
          <Button
            type="text"
            className={styles.play}
            icon={item.playingId === idx ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => item.play(idx)}
          />
        )}
        <span className={cls.name}>{v[item.namekey]}</span>
        <span className={cls.text}>{v[item.textkey]}</span>
      </div>
    );
  });

  return val;
});
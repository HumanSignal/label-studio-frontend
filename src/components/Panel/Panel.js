import React from "react";
import { observer } from "mobx-react";
import { Button } from "antd";
import {
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  RollbackOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from "@ant-design/icons";

import styles from "./Panel.module.scss";
import Hint from "../Hint/Hint";

/**
 * Panel component with buttons:
 * Undo
 * Redo
 * Reset
 * Show Instructions
 * Settings
 */
export default observer(({ store }) => {
  const { history } = store.annotationStore.selected;
  const classname = [
    styles.block,
    styles.block__controls,
    store.annotationStore.viewingAllAnnotations ? styles.hidden : "",
  ].join(" ");

  return (
    <div className={styles.container + " ls-panel"}>
      <div className={classname}>
        <Button
          type="ghost"
          icon={<UndoOutlined />}
          disabled={!history?.canUndo}
          onClick={ev => {
            history && history.canUndo && history.undo();
            ev.preventDefault();
          }}
        >
          Undo
          {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ Ctrl+z ]</Hint>}
        </Button>
        <Button
          type="ghost"
          disabled={!history?.canRedo}
          icon={<RedoOutlined />}
          onClick={ev => {
            history && history.canRedo && history.redo();
            ev.preventDefault();
          }}
        >
          Redo
        </Button>
        <Button
          type="ghost"
          disabled={!history?.canUndo}
          icon={<RollbackOutlined />}
          onClick={() => {
            history && history.reset();
          }}
        >
          Reset
        </Button>
        {store.setPrelabeling && (
          <Button
            style={{ display: "none" }}
            onClick={() => {
              store.resetPrelabeling();
            }}
          >
            {" "}
            Reset Prelabeling
          </Button>
        )}
        {store.hasInterface("debug") && (
          <span>
            {history.undoIdx} / {history.history.length}
            {history.isFrozen && " (frozen)"}
          </span>
        )}
      </div>

      <div className={[styles.block, styles.common].join(" ")}>
        {store.description && store.showingDescription && (
          <Button
            onClick={() => {
              store.toggleDescription();
            }}
          >
            Hide Instructions
          </Button>
        )}
        {store.description && !store.showingDescription && (
          <Button
            onClick={() => {
              store.toggleDescription();
            }}
          >
            Instructions
          </Button>
        )}

        <Button
          icon={<SettingOutlined />}
          onClick={ev => {
            store.toggleSettings();
            ev.preventDefault();
            return false;
          }}
        />
        <Button
          className="ls-fs"
          icon={store.settings.fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={ev => {
            store.settings.toggleFullscreen();
            ev.preventDefault();
            return false;
          }}
        />
      </div>
    </div>
  );
});

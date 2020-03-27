import React from "react";
import { observer } from "mobx-react";
import { Button } from "antd";
import {
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  RollbackOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
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
  const { history } = store.completionStore.selected;

  return (
    <div className={styles.container + " ls-panel"}>
      <div className={`${styles.block} ${styles.block__controls}`}>
        <Button
          type="ghost"
          icon={<UndoOutlined />}
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
          icon={<RollbackOutlined />}
          onClick={ev => {
            history && history.reset();
          }}
        >
          Reset
        </Button>
        {store.setPrelabeling && (
          <Button
            style={{ display: "none" }}
            onClick={ev => {
              store.resetPrelabeling();
            }}
          >
            {" "}
            Reset Prelabeling
          </Button>
        )}
      </div>

      <div className={styles.block}>
        {store.description && store.showingDescription && (
          <Button
            type="primary"
            onClick={ev => {
              store.toggleDescription();
            }}
          >
            Hide Instructions
          </Button>
        )}
        {store.description && !store.showingDescription && (
          <Button
            type="primary"
            onClick={ev => {
              store.toggleDescription();
            }}
          >
            Show Instructions
          </Button>
        )}

        <Button
          type="dashed"
          icon={<SettingOutlined />}
          onClick={ev => {
            store.toggleSettings();
            ev.preventDefault();
            return false;
          }}
        />

        {/* <Button */}
        {/*   type="dashed" */}
        {/*   icon={store.settings.fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} */}
        {/*   onClick={ev => { */}
        {/*     store.settings.toggleFullscreen(); */}
        {/*     ev.preventDefault(); */}
        {/*     return false; */}
        {/*   }} */}
        {/* /> */}
      </div>
    </div>
  );
});

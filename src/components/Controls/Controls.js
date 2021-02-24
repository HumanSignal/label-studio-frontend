import React from "react";
import { Button, Tooltip } from "antd";
import { observer, inject } from "mobx-react";
import { CheckOutlined, CheckCircleOutlined } from "@ant-design/icons";

import Hint from "../Hint/Hint";
import { DraftPanel } from "../Completions/Completions";
import styles from "./Controls.module.scss";

const TOOLTIP_DELAY = 0.8;

export default inject("store")(
  observer(({ item, store }) => {
    const { userGenerate, sentUserGenerate, versions } = item;
    const { enableHotkeys, enableTooltips } = store.settings;

    let draftMenu;
    let taskInformation;

    /**
     * UI Controls
     */
    let controls = store.controls
      .concat([
        {
          name: "Submit",
          description: "Save results",
          hotkey: "ctrl+enter",
          priority: 10,
          display:
            (userGenerate && !sentUserGenerate) || (store.explore && !userGenerate && store.hasInterface("submit")),
          type: "primary",
          icon: <CheckOutlined />,
          handler: store.submitCompletion,
          classes: styles.submit + " ls-submit-btn",
        },
        {
          name: "Skip",
          description: "Cancel (skip) task",
          hotkey: "ctrl+space",
          priority: 20,
          display: store.hasInterface("skip"),
          type: "ghost",
          handler: store.skipTask,
          classes: styles.skip + " ls-skip-btn",
        },
        {
          name: sentUserGenerate || versions.result ? "Update" : "Submit",
          description: "Update this task",
          hotkey: "alt+enter",
          priority: 30,
          display: (userGenerate && sentUserGenerate) || (!userGenerate && store.hasInterface("update")),
          type: "primary",
          icon: <CheckCircleOutlined />,
          handler: store.updateCompletion,
          classes: "ls-update-btn",
        },
      ])
      .filter(c => c.display);

    /**
     * Task information
     */
    if (store.task) {
      taskInformation = <h4 className={styles.task + " ls-task-info"}>Task ID: {store.task.id}</h4>;
    }

    /**
     * Add tooltips
     */
    controls.forEach(control => {
      const hotkey = control.hotkey
        .split("+")
        .map(key => key.charAt(0).toUpperCase() + key.slice(1))
        .join(" + ");

      control.hint = `[${hotkey}]`;
      control.title = `${control.description}: ${control.hint}`;
    });

    /**
     * Check for Predict Menu
     */
    if (!store.completionStore.predictSelect || store.explore) {
      const disabled = store.isSubmitting;
      const hints = enableHotkeys && enableTooltips;

      controls = controls
        .sort((a, b) => a.priority - b.priority)
        .map(control => (
          <Tooltip key={control.name} title={control.title} mouseEnterDelay={TOOLTIP_DELAY}>
            <Button
              disabled={disabled}
              type={control.type}
              icon={control.icon}
              onClick={control.handler || store.getControlHandler(control)}
              className={control.classes}
            >
              {control.name} {hints ? <Hint>{control.hint}</Hint> : ""}
            </Button>
          </Tooltip>
        ));

      if (!store.hasInterface("completions:menu")) {
        draftMenu = <DraftPanel item={item} />;
      }
    }

    let content = (
      <div className={styles.block}>
        <div className={styles.wrapper}>
          <div className={styles.container}>
            {controls}
            {draftMenu}
          </div>
          {taskInformation}
        </div>
      </div>
    );

    return (item.type === "completion" || store.explore) && content;
  }),
);

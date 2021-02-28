import React from "react";
import { Button, Popconfirm, Card, Tooltip } from "antd";
import { observer } from "mobx-react";
import { DeleteOutlined, CopyOutlined } from "@ant-design/icons";

import Utils from "../../utils";

import Hint from "../Hint/Hint";
import Entities from "../Entities/Entities";
import Entity from "../Entity/Entity";
import Relations from "../Relations/Relations";
import styles from "./SideColumn.module.scss";
import messages from "../../utils/messages";
import Controls from "../Controls/Controls";

/**
 * Component Side with:
 * Completions
 * Entities
 * Relations
 */
export default observer(({ store }) => {
  const cs = store.completionStore;
  const c = cs.selected;
  const node = c.highlightedNode;

  const { regions } = c.regionStore;

  const buttonRemove = () => {
    const confirm = () => {
      c.deleteAllRegions();
    };

    return (
      <Popconfirm
        placement="bottomLeft"
        title={messages.CONFIRM_TO_DELETE_ALL_REGIONS}
        onConfirm={confirm}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
      >
        <Button size="small" type="danger">
          <DeleteOutlined />
          {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ ctrl+bksp ]</Hint>}
        </Button>
      </Popconfirm>
    );
  };

  return c.type === "prediction" ? (
    <Card size="small" className={styles.card}>
      Prediction {c.id}
      <div>
        <div className={styles.title}>{c.createdBy ? `Model (${c.createdBy})` : null}</div>
        Created
        <i>{c.createdAgo ? ` ${c.createdAgo} ago` : ` ${Utils.UDate.prettyDate(c.createdDate)}`}</i>
      </div>
      <Tooltip placement="topLeft" title="Add a new completion based on this prediction">
        <Button
          size="small"
          onClick={ev => {
            ev.preventDefault();

            const cs = store.completionStore;
            const p = cs.selected;
            const c = cs.addCompletionFromPrediction(p);

            // this is here because otherwise React doesn't re-render the change in the tree
            window.setTimeout(function() {
              store.completionStore.selectCompletion(c.id);
            }, 50);
          }}
        >
          <CopyOutlined />
        </Button>
      </Tooltip>
      {store.hasInterface("controls") && <Controls item={cs.selected} />}
      {node && <Entity store={store} completion={c} />}
      {!c.highlightedNode && <p style={{ marginBottom: 0 }}>Nothing selected</p>}
      <Entities store={store} regionStore={c.regionStore} />
      <Relations store={store} item={c} />
    </Card>
  ) : (
    <Card size="small" className={styles.card}>
      Annotation {c.id}
      <i>{c.createdAgo ? ` ${c.createdAgo} ago` : ` ${Utils.UDate.prettyDate(c.createdDate)}`}</i>
      <br />
      {c.createdBy ? ` by ${c.createdBy}` : null}
      <br />
      {store.hasInterface("completions:delete") && (
        <Tooltip placement="topLeft" title="Delete selected completion">
          <Popconfirm
            placement="bottomLeft"
            title={"Please confirm you want to delete this completion"}
            onConfirm={() => {
              c.list.deleteCompletion(c);
            }}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button size="small" danger style={{ background: "transparent" }}>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Tooltip>
      )}
      {store.hasInterface("controls") && <Controls item={cs.selected} />}
      {node && <Entity store={store} completion={c} />}
      {!c.highlightedNode && <p style={{ marginBottom: 0 }}>Nothing selected</p>}
      <Entities store={store} regionStore={c.regionStore} />
      <Relations store={store} item={c} />
    </Card>
  );
});

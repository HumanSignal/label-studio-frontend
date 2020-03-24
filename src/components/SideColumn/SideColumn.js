import React from "react";
import { Button, Popconfirm, Card, Divider } from "antd";
import { observer } from "mobx-react";
import { DeleteOutlined } from "@ant-design/icons";

import Hint from "../Hint/Hint";
import Entities from "../Entities/Entities";
import Entity from "../Entity/Entity";
import Relations from "../Relations/Relations";
import styles from "./SideColumn.module.scss";

/**
 * Component Side with:
 * Completions
 * Entities
 * Relations
 */
export default observer(({ store }) => {
  const completion = store.completionStore.selected;
  const c = store.completionStore.selected;
  const node = completion.highlightedNode;

  const { regions } = c.regionStore;

  const buttonRemove = () => {
    const confirm = () => {
      c.deleteAllRegions();
    };

    return (
      <Popconfirm
        placement="bottomLeft"
        title={"Please confirm you want to delete all labeled regions"}
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

  let title = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0 }}>Results</h3>
      {regions.length > 0 && c.edittable && buttonRemove()}
    </div>
  );

  return (
    <Card title={title} size="small" className={styles.card}>
      {node && <Entity store={store} completion={completion} />}

      {!completion.highlightedNode && <p style={{ marginBottom: 0 }}>Nothing selected</p>}

      <Entities store={store} regionStore={completion.regionStore} />

      <Relations store={store} item={completion} />
    </Card>
  );
});

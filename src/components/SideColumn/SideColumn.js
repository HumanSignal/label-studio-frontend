import React from "react";
import { Button, Popconfirm, Card } from "antd";
import { observer } from "mobx-react";
import { DeleteOutlined } from "@ant-design/icons";

import Hint from "../Hint/Hint";
import Entities from "../Entities/Entities";
import Entity from "../Entity/Entity";
import Relations from "../Relations/Relations";
import styles from "./SideColumn.module.scss";
import messages from "../../utils/messages";

/**
 * Component Side with:
 * Annotations
 * Entities
 * Relations
 */
export default observer(({ store }) => {
  const annotation = store.annotationStore.selected;
  const c = store.annotationStore.selected;
  const node = annotation.highlightedNode;

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

  let title = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0 }}>Results</h3>
      {regions.length > 0 && c.editable && buttonRemove()}
    </div>
  );

  return (
    <Card title={title} size="small" className={styles.card}>
      {node && <Entity store={store} annotation={annotation} />}

      {!annotation.highlightedNode && <p style={{ marginBottom: 0 }}>Nothing selected</p>}

      <Entities store={store} regionStore={annotation.regionStore} />

      <Relations store={store} item={annotation} />
    </Card>
  );
});

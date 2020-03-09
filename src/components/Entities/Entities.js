import React, { Fragment } from "react";
import { Button, Popconfirm, List, Typography, Divider, Badge } from "antd";
import { getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";

import Hint from "../Hint/Hint";
import styles from "./Entities.module.scss";
import { Node } from "../Node/Node";

const EntityItem = observer(({ item, idx }) => {
  const selected = item.selected ? "#f1f1f1" : "transparent";

  return (
    <List.Item
      key={item.id}
      style={{ cursor: "pointer", background: selected }}
      onClick={() => {
        getRoot(item).completionStore.selected.regionStore.unselectAll();
        item.selectRegion();
      }}
      onMouseOver={() => {
        item.toggleHighlight();
      }}
      onMouseOut={() => {
        item.toggleHighlight();
      }}
    >
      <Badge count={idx + 1} style={{ backgroundColor: item.getOneColor() }} />
      &nbsp; <Node node={item} />
    </List.Item>
  );
});

export default observer(({ store, regionStore }) => {
  const { regions } = regionStore;
  const c = store.completionStore.selected;

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
        <Button type="link" style={{ paddingLeft: "10px", paddingRight: 0, fontSize: "12px" }}>
          Remove all
          {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ ctrl+bksp ]</Hint>}
        </Button>
      </Popconfirm>
    );
  };

  return (
    <div>
      <Divider dashed orientation="left">
        Entities ({regions.length}) {regions.length > 0 && c.edittable && buttonRemove()}
      </Divider>
      {!regions.length && <p>No Entities added yet</p>}
      {regions.length > 0 && (
        <div>
          <List
            size="small"
            dataSource={regions}
            className={styles.list}
            bordered
            renderItem={(item, idx) => <EntityItem item={item} idx={idx} />}
          />
        </div>
      )}
    </div>
  );
});

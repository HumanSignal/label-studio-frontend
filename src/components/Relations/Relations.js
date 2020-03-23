import React, { Fragment } from "react";
import { Popover, Select, Divider, List, Button, Dropdown, Menu } from "antd";
import { isValidReference } from "mobx-state-tree";
import { observer } from "mobx-react";
import { ArrowLeftOutlined, ArrowRightOutlined, SwapOutlined, MoreOutlined, DeleteOutlined } from "@ant-design/icons";

import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import styles from "./Relations.module.scss";
import { NodeMinimal } from "../Node/Node";

const { Option } = Select;

const RelationMeta = observer(({ store, rl }) => {
  const r = rl.relations;
  const selected = r.getSelected().map(v => v.value);

  return (
    <div style={{ marginTop: "10px" }}>
      <h4 className={styles.header}>LABELS</h4>
      <Select
        mode={r.choice === "multiple" ? "multiple" : ""}
        style={{ width: "100%" }}
        placeholder="Please select"
        defaultValue={selected}
        onChange={(val, option) => {
          r.unselectAll();
          val.forEach(v => r.findRelation(v).setSelected(true));
        }}
      >
        {r.children.map(c => (
          <Option key={c.value} style={{ background: c.background }}>
            {c.value}
          </Option>
        ))}
      </Select>
    </div>
  );
});

/**
 * Relation Component
 *
 * Shows the relationship between two selected items
 */
const Relation = observer(({ store, rl }) => {
  if (!isValidReference(() => rl.node1) || !isValidReference(() => rl.node2)) {
    return null;
  }

  const iconMap = {
    left: <ArrowLeftOutlined />,
    right: <ArrowRightOutlined />,
    bi: <SwapOutlined />,
  };

  return (
    <div>
      <div className={styles.section__blocks}>
        <div>
          <NodeMinimal node={rl.node1} />
        </div>
        <Button onClick={() => rl.rotateDirection()} size="small" className={styles.relationbtn}>
          {iconMap[rl.direction]}
        </Button>
        <div>
          <NodeMinimal node={rl.node2} />
        </div>
      </div>
    </div>
  );
});

const ListItem = observer(({ item }) => {
  return (
    <List.Item
      key={item.id}
      actions={[]}
      onMouseOver={() => {
        item.toggleHighlight();
      }}
      onMouseOut={() => {
        item.toggleHighlight();
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Relation rl={item} />
        </div>
        <div>
          {item.hasRelations && (
            <Button
              size="small"
              onClick={() => {
                item.toggleMeta();
              }}
              className={styles.button}
            >
              <MoreOutlined />
            </Button>
          )}
          &nbsp;
          <Button
            size="small"
            className={styles.button}
            onClick={() => {
              item.node1.setHighlight(false);
              item.node2.setHighlight(false);
              item.parent.deleteRelation(item);
              return false;
            }}
            danger
          >
            <DeleteOutlined />
          </Button>
        </div>
      </div>
      {item.showMeta && <RelationMeta rl={item} />}
    </List.Item>
  );
});

export default observer(({ store }) => {
  const completion = store.completionStore.selected;
  const { relations } = completion.relationStore;

  return (
    <Fragment>
      <Divider dashed orientation="left">
        Relations ({relations.length})
      </Divider>
      {!relations.length && <p>No Relations added yet</p>}

      {relations.length > 0 && (
        <List
          size="small"
          bordered
          itemLayout="vertical"
          className={styles.list}
          dataSource={completion.relationStore.relations}
          renderItem={item => <ListItem item={item} />}
        />
      )}
    </Fragment>
  );
});

import React, { Fragment } from "react";
import { Select, Divider, List, Button, Checkbox } from "antd";
import { isValidReference, getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";
import { ArrowLeftOutlined, ArrowRightOutlined, SwapOutlined, MoreOutlined, DeleteOutlined } from "@ant-design/icons";

import styles from "./Relations.module.scss";
import { NodeMinimal } from "../Node/Node";
import { wrapArray } from "../../utils/utilities";

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
          const values = wrapArray(val);
          r.unselectAll();
          values.forEach(v => r.findRelation(v).setSelected(true));
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
  const node = getRoot(item).completionStore.selected.highlightedNode;
  const isSelected = node === item.node1 || node === item.node2;

  return (
    <List.Item
      className={isSelected && styles.selected}
      key={item.id}
      actions={[]}
      onMouseEnter={() => {
        item.toggleHighlight();
        item.setSelfHighlight(true);
      }}
      onMouseLeave={() => {
        item.toggleHighlight();
        item.setSelfHighlight(false);
      }}
    >
      <div className={styles.item}>
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
      {/* override LS styles' height */}
      <Divider dashed orientation="left" style={{ height: "auto" }}>
        Relations ({relations.length})
      </Divider>

      <p>
        <Checkbox
          value="Show connection lines"
          defaultChecked={completion.relationStore.showConnections}
          onChange={() => {
            completion.relationStore.toggleConnections();
          }}
        >
          Show connection lines
        </Checkbox>
      </p>

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

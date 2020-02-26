import React, { Fragment } from "react";
import { Icon, Divider, List, Button } from "antd";
import { isValidReference } from "mobx-state-tree";
import { observer } from "mobx-react";

import styles from "./Relations.module.scss";
import { NodeMinimal } from "../Node/Node";

/**
 * Relation Component
 *
 * Shows the relationship between two selected items
 */
const Relation = ({ store, rl }) => {
  if (!isValidReference(() => rl.node1) || !isValidReference(() => rl.node2)) {
    return null;
  }

  return (
    <div className={styles.section__blocks}>
      <div>
        <NodeMinimal node={rl.node1} />
      </div>
      <Icon type="arrow-right" style={{ marginLeft: "10px", marginRight: "10px" }} />
      <div>
        <NodeMinimal node={rl.node2} />
      </div>
    </div>
  );
};

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
          itemLayout="horizontal"
          className={styles.list}
          dataSource={completion.relationStore.relations}
          renderItem={item => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="danger"
                  size="small"
                  className={styles.button}
                  onClick={() => {
                    item.node1.setHighlight(false);
                    item.node2.setHighlight(false);
                    item.parent.deleteRelation(item);
                    return false;
                  }}
                >
                  <Icon type="delete" />
                </Button>,
              ]}
              onMouseOver={() => {
                item.toggleHighlight();
              }}
              onMouseOut={() => {
                item.toggleHighlight();
              }}
            >
              <Relation store={completion.relationStore} rl={item} />
            </List.Item>
          )}
        />
      )}
    </Fragment>
  );
});

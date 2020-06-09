/* eslint-disable no-unused-vars */
// @todo there is lot of unused code which is till useful; deal with it!
import React from "react";
import { Radio, Tabs, Button, Popconfirm, List, Typography, Divider, Badge, Menu, Dropdown, Tree, Switch } from "antd";
import { getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";

import { SortAscendingOutlined, GroupOutlined, CalendarOutlined, ThunderboltOutlined } from "@ant-design/icons";

import Utils from "../../utils";
import Hint from "../Hint/Hint";
import styles from "./Entities.module.scss";
import globalStyles from "../../styles/global.module.scss";
import { Node } from "../Node/Node";

const { TabPane } = Tabs;

const RenderSubState = observer(({ item, idx }) => {
  const states = item.perRegionStates;
  if (!states) return null;

  return states
    .filter(s => s.holdsState)
    .map(s => (
      <div key={s.id}>
        <span style={{ marginRight: "16px" }}>•</span>
        <Node node={s} onClick={() => {}} />
      </div>
    ));
});

const EntityItem = observer(({ item, idx }) => {
  const classnames = [styles.lstitem, item.hidden === true && styles.hidden, item.selected && styles.selected].filter(
    Boolean,
  );

  const oneColor = item.getOneColor();
  let badgeStyle = {};

  if (oneColor) {
    badgeStyle = {
      backgroundColor: oneColor,
    };
  } else {
    badgeStyle = {
      backgroundColor: "#fff",
      color: "#999",
      boxShadow: "0 0 0 1px #d9d9d9 inset",
    };
  }

  return (
    <List.Item
      key={item.id}
      className={classnames.join(" ")}
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
      <Badge count={idx + 1} style={badgeStyle} />
      <Node node={item} />

      {!item.editable && <Badge count={"ro"} style={{ backgroundColor: "#ccc" }} />}

      {item.score && (
        <span
          className={styles.confbadge}
          style={{
            color: Utils.Colors.getScaleGradient(item.score),
          }}
        >
          {item.score.toFixed(2)}
        </span>
      )}
    </List.Item>
  );
});

const groupMenu = (
  <Menu>
    <Menu.Item className={globalStyles.link}>By Type</Menu.Item>
    <Menu.Item className={globalStyles.link}>By Label</Menu.Item>
  </Menu>
);

const LabelsGroup = (store, regionStore) => {
  const { regions } = regionStore;
  const c = store.completionStore.selected;
  const tabTitle = <span>Labels (2)</span>;

  const treeData = [
    {
      title: "parent 1",
      key: "0-0",
      children: [
        {
          title: "leaf",
          key: "0-0-0",
        },
        {
          title: "leaf",
          key: "0-0-1",
        },
      ],
    },
  ];

  return (
    <Tree
      showIcon
      defaultExpandAll
      defaultSelectedKeys={["0-0-0"]}
      //switcherIcon={}
      treeData={treeData}
    />
  );
};

const EntitiesTab = (store, regionStore) => {
  const { regions } = regionStore;
  const c = store.completionStore.selected;

  const entname = <span>Regions ({regions.length})</span>;

  return (
    <TabPane tab={entname} key="1" style={{ marginBottom: "0" }}>
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
    </TabPane>
  );
};

export default observer(({ store, regionStore }) => {
  const { regions } = regionStore;
  const c = store.completionStore.selected;

  const entname = <span>Regions ({regions.length})</span>;

  const changeSortOrder = () => {
    regionStore.toggleSortOrder();
  };

  const sortMenu = (
    <Menu selectedKeys={[regionStore.sort]}>
      <Menu.Item key="date">
        <div
          onClick={ev => {
            regionStore.setSort("date");
            ev.preventDefault();
            return false;
          }}
          style={{ width: "135px", display: "flex", justifyContent: "space-between" }}
        >
          <div>
            <CalendarOutlined /> Date
          </div>
          <div>
            {/* regionStore.sort === "date" && <Switch onChange={changeSortOrder} size="small" checkedChildren="Asc" unCheckedChildren="Desc" /> */}
          </div>
        </div>
      </Menu.Item>
      <Menu.Item key="score">
        <div
          onClick={ev => {
            regionStore.setSort("score");
            ev.preventDefault();
            return false;
          }}
          style={{ width: "135px", display: "flex", justifyContent: "space-between" }}
        >
          <div>
            <ThunderboltOutlined /> Score
          </div>
          <div>
            {/* regionStore.sort === "score" &&  */
            /* <Switch onChange={changeSortOrder} size="small" checkedChildren="Asc" unCheckedChildren="Desc" /> */}
          </div>
        </div>
      </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingLeft: "4px",
          paddingRight: "4px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <Divider dashed orientation="left">
            Regions ({regions.length})
          </Divider>
        </div>
        {regions.length > 0 && (
          <Dropdown overlay={sortMenu} placement="bottomLeft">
            <span className={globalStyles.link} onClick={e => e.preventDefault()}>
              <SortAscendingOutlined /> Sort
            </span>
          </Dropdown>
        )}
      </div>
      {!regions.length && <p>No Regions created yet</p>}
      {regions.length > 0 && (
        <List
          size="small"
          dataSource={regionStore.sortedRegions}
          className={styles.list}
          bordered
          renderItem={(item, idx) => <EntityItem item={item} idx={idx} />}
        />
      )}
    </div>
  );
});

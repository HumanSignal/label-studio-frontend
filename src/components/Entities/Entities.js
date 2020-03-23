import React, { Fragment } from "react";
import { Radio, Tabs, Button, Popconfirm, List, Typography, Divider, Badge, Menu, Dropdown, Tree, Switch } from "antd";
import { getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";

import { SortAscendingOutlined, GroupOutlined, CalendarOutlined, ThunderboltOutlined } from "@ant-design/icons";

import Utils from "../../utils";
import Hint from "../Hint/Hint";
import styles from "./Entities.module.scss";
import { Node } from "../Node/Node";

const { TabPane } = Tabs;

const EntityItem = observer(({ item, idx }) => {
  const selected = item.selected ? "#f1f1f1" : "transparent";

  return (
    <List.Item
      key={item.id}
      className={styles.lstitem}
      style={{ background: selected }}
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
      <span>
        <Badge count={idx + 1} style={{ backgroundColor: item.getOneColor() }} />
        &nbsp; <Node node={item} />
      </span>

      {item.confidence && (
        <span
          className={styles.confbadge}
          style={{
            color: Utils.Colors.getScaleGradient(item.confidence),
          }}
        >
          {item.confidence.toFixed(2)}
        </span>
      )}
    </List.Item>
  );
});

const groupMenu = (
  <Menu>
    <Menu.Item>
      <a target="_blank" rel="noopener noreferrer" href="">
        By Type
      </a>
    </Menu.Item>
    <Menu.Item>
      <a target="_blank" rel="noopener noreferrer" href="">
        By Label
      </a>
    </Menu.Item>
  </Menu>
);

const LabelsTab = (store, regionStore) => {
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
    <TabPane tab={tabTitle} key="2">
      <Tree
        showIcon
        defaultExpandAll
        defaultSelectedKeys={["0-0-0"]}
        //switcherIcon={}
        treeData={treeData}
      />
    </TabPane>
  );
};

const EntitiesTab = (store, regionStore) => {
  const { regions } = regionStore;
  const c = store.completionStore.selected;

  const entname = <span>Entities ({regions.length})</span>;

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

  const entname = <span>Entities ({regions.length})</span>;

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
          style={{ width: "175px", display: "flex", justifyContent: "space-between" }}
        >
          <div>
            <CalendarOutlined /> Date
          </div>
          <div>
            {/* regionStore.sort === "date" && <Switch onChange={changeSortOrder} size="small" checkedChildren="Asc" unCheckedChildren="Desc" /> */}
          </div>
        </div>
      </Menu.Item>
      <Menu.Item key="confidence">
        <div
          onClick={ev => {
            regionStore.setSort("confidence");
            ev.preventDefault();
            return false;
          }}
          style={{ width: "175px", display: "flex", justifyContent: "space-between" }}
        >
          <div>
            <ThunderboltOutlined /> Confidence
          </div>
          <div>
            {/* regionStore.sort === "confidence" &&  */
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
          paddingLeft: "6px",
          paddingRight: "4px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <Divider dashed orientation="left">
            Entities ({regions.length})
          </Divider>
        </div>
        {regions.length > 0 && (
          <div>
            <Dropdown overlay={sortMenu} placement="bottomLeft">
              <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                <SortAscendingOutlined /> Sort
              </a>
            </Dropdown>
            &nbsp;&nbsp;&nbsp;
            {/* <Dropdown overlay={groupMenu} placement="bottomLeft"> */}
            {/*   <a className="ant-dropdown-link" onClick={e => e.preventDefault()}> */}
            {/*     <GroupOutlined /> Group */}
            {/*   </a> */}
            {/* </Dropdown> */}
          </div>
        )}
      </div>
      {!regions.length && <p>No Entities added yet</p>}
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

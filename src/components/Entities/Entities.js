import React from "react";
import { List, Divider, Badge, Menu, Dropdown, Tree, Tag } from "antd";
import { getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";

import { DownOutlined, SortAscendingOutlined, CalendarOutlined, ThunderboltOutlined } from "@ant-design/icons";

import Utils from "../../utils";
import "./Entities.scss";
import styles from "./Entities.module.scss";
import globalStyles from "../../styles/global.module.scss";
import { Node } from "../Node/Node";
import { SimpleBadge } from "../SimpleBadge/SimpleBadge";

const RegionItem = observer(({ item, idx, flat }) => {
  const cs = getRoot(item).completionStore;
  const classnames = [
    styles.lstitem,
    flat && styles.flat,
    item.hidden === true && styles.hidden,
    item.selected && styles.selected,
  ].filter(Boolean);

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
        cs && cs.selected.regionStore.unselectAll();
        item.selectRegion();
      }}
      onMouseOver={() => {
        cs && cs.selected.regionStore.unhighlightAll();
        item.setHighlight(true);
      }}
      onMouseOut={() => {
        cs && cs.selected.regionStore.unhighlightAll();
        item.setHighlight(false);
      }}
    >
      <SimpleBadge number={idx + 1} style={badgeStyle} />
      <Node node={item} onClick={() => {}} className={styles.node} />

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

const LabelItem = observer(({ item, idx }) => {
  const bg = item.background;
  const labelStyle = {
    backgroundColor: bg,
    color: item.selectedcolor,
    cursor: "pointer",
    margin: "5px",
  };

  return (
    <Tag style={labelStyle} size={item.size}>
      {item._value}
    </Tag>
  );
});

const GroupMenu = ({ store, regionStore }) => {
  return (
    <Menu selectedKeys={[regionStore.view]}>
      <Menu.Item key="regions">
        <div
          onClick={ev => {
            regionStore.setView("regions");
            ev.preventDefault();
            return false;
          }}
          style={{ width: "135px", display: "flex", justifyContent: "space-between" }}
        >
          <div>Regions</div>
        </div>
      </Menu.Item>
      <Menu.Item key="labels">
        <div
          onClick={ev => {
            regionStore.setView("labels");
            ev.preventDefault();
            return false;
          }}
          style={{ width: "135px", display: "flex", justifyContent: "space-between" }}
        >
          <div>Labels</div>
        </div>
      </Menu.Item>
    </Menu>
  );
};

const SortMenu = observer(({ regionStore }) => {
  return (
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
});

const LabelsList = observer(({ regionStore }) => {
  const treeData = regionStore.asLabelsTree((item, idx, isLabel) => {
    return {
      key: item.id,
      title: isLabel ? <LabelItem item={item} idx={idx} /> : <RegionItem item={item} idx={idx} />,
    };
  });

  return (
    <Tree
      className={styles.treelabels}
      style={{ border: "1px solid #d9d9d9", borderRadius: "2px" }}
      treeData={treeData}
      showIcon={false}
      blockNode={true}
      defaultExpandAll={true}
      autoExpandParent={true}
      switcherIcon={<DownOutlined />}
    />
  );
});

const RegionsTree = observer(({ regionStore }) => {
  const isFlat = !regionStore.sortedRegions.some(r => r.parentID !== "");
  const treeData = regionStore.asTree((item, idx) => {
    return {
      key: item.id,
      title: <RegionItem item={item} idx={idx} flat={isFlat} />,
    };
  });

  return (
    <Tree
      className={styles.treelabels}
      treeData={treeData}
      draggable={true}
      showIcon={false}
      blockNode={true}
      defaultExpandAll={true}
      autoExpandParent={true}
      switcherIcon={<DownOutlined />}
      onDrop={({ node, dragNode, dropPosition, dropToGap }) => {
        const dropKey = node.props.eventKey;
        const dragKey = dragNode.props.eventKey;
        const dropPos = node.props.pos.split("-");
        dropPosition = dropPosition - parseInt(dropPos[dropPos.length - 1]);
        const treeDepth = dropPos.length;

        const dropReg = regionStore.findRegionID(dropKey);
        const dragReg = regionStore.findRegionID(dragKey);

        regionStore.unhighlightAll();

        if (treeDepth === 2 && dropToGap && dropPosition === -1) {
          dragReg.setParentID("");
        } else if (dropPosition !== -1) {
          dragReg.setParentID(dropReg.pid);
        }
      }}
    >
      {/* <TreeNode title="hello" key="0-0" style={{ width: '100%' }} /> */}
    </Tree>
  );
});

export default observer(({ store, regionStore }) => {
  const { regions } = regionStore;

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
            <Dropdown overlay={<GroupMenu regionStore={regionStore} />} placement="bottomLeft">
              <span className={globalStyles.link} onClick={e => e.preventDefault()}>
                {regionStore.view === "regions" ? <span>Regions ({regions.length})</span> : null}
                {regionStore.view === "labels" ? "Labels" : null}
              </span>
            </Dropdown>
          </Divider>
        </div>
        {regions.length > 0 && regionStore.view === "regions" && (
          <Dropdown overlay={<SortMenu regionStore={regionStore} />} placement="bottomLeft">
            <span className={globalStyles.link} onClick={e => e.preventDefault()}>
              <SortAscendingOutlined /> Sort
            </span>
          </Dropdown>
        )}
      </div>
      {!regions.length && <p>No Regions created yet</p>}

      {regions.length > 0 && regionStore.view === "regions" && <RegionsTree regionStore={regionStore} />}

      {regions.length > 0 && regionStore.view === "labels" && <LabelsList regionStore={regionStore} />}
    </div>
  );
});

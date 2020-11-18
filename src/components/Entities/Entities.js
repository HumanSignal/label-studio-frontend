import React from "react";
import { List, Divider, Badge, Menu, Dropdown, Spin, Tree, Tag, Button } from "antd";
import { getRoot, isAlive } from "mobx-state-tree";
import { observer } from "mobx-react";

import {
  DownOutlined,
  SortAscendingOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import Utils from "../../utils";
import "./Entities.scss";
import styles from "./Entities.module.scss";
import globalStyles from "../../styles/global.module.scss";
import { Node } from "../Node/Node";
import { SimpleBadge } from "../SimpleBadge/SimpleBadge";

const RegionItem = observer(({ item, idx, flat }) => {
  if (!isAlive(item)) return null;
  const c = getRoot(item).completionStore.selected;
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
        c.selectArea(item);
      }}
      onMouseOver={() => {
        item.setHighlight(true);
      }}
      onMouseOut={() => {
        item.setHighlight(false);
      }}
    >
      <SimpleBadge number={idx + 1} style={badgeStyle} />
      <Node node={item} className={styles.node} />

      {!item.editable && <Badge count={"ro"} style={{ backgroundColor: "#ccc" }} />}

      {item.hideable && (
        <Button
          size="small"
          type="text"
          icon={item.hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={item.toggleHidden}
          className={item.hidden ? styles.hidden : styles.visible}
        />
      )}

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
          <span>
            <CalendarOutlined /> Date
          </span>
          <span>{regionStore.sort === "date" && (regionStore.sortOrder === "asc" ? "↓" : "↑")}</span>
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
          <span>
            <ThunderboltOutlined /> Score
          </span>
          <span>{regionStore.sort === "score" && (regionStore.sortOrder === "asc" ? "↓" : "↑")}</span>
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
  // @todo improve list render
  // this whole block performs async render to not block the rest of UI on first render
  const [deferred, setDeferred] = React.useState(true);
  const renderNow = React.useCallback(() => setDeferred(false), []);
  React.useEffect(() => {
    setTimeout(renderNow);
  }, [renderNow]);

  if (deferred)
    return (
      <div style={{ textAlign: "center" }}>
        <Spin />
      </div>
    );

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
          // check if the dragReg can be a child of dropReg
          const selDrop = dropReg.labeling?.selectedLabels || [];
          const labelWithConstraint = selDrop.filter(l => l.groupcancontain);

          if (labelWithConstraint.length) {
            const selDrag = dragReg.labeling.selectedLabels;

            const set1 = Utils.Checkers.flatten(labelWithConstraint.map(l => l.groupcancontain.split(",")));
            const set2 = Utils.Checkers.flatten(selDrag.map(l => (l.alias ? [l.alias, l.value] : [l.value])));

            if (set1.filter(value => -1 !== set2.indexOf(value)).length === 0) return;
          }

          // check drop regions tree depth
          if (dropReg.labeling?.from_name?.groupdepth) {
            let maxDepth = Number(dropReg.labeling.from_name.groupdepth);

            // find the height of the tree formed by dragReg for
            // example if we have a tree of A -> B -> C -> D and
            // we're moving B -> C part somewhere then it'd have a
            // height of 1
            let treeHeight;
            treeHeight = function(node) {
              if (!node) return 0;

              // TODO this can blow up if we have lots of stuff there
              const childrenHeight = regionStore.filterByParentID(node.pid).map(c => treeHeight(c));

              if (!childrenHeight.length) return 0;

              return 1 + Math.max.apply(Math, childrenHeight);
            };

            if (maxDepth >= 0) {
              maxDepth = maxDepth - treeHeight(dragReg);
              let reg = dropReg;
              while (reg) {
                reg = regionStore.findRegion(reg.parentID);
                maxDepth = maxDepth - 1;
              }

              if (maxDepth < 0) return;
            }
          }

          dragReg.setParentID(dropReg.id);
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
          {/* override LS styles' height */}
          <Divider dashed orientation="left" style={{ height: "auto" }}>
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

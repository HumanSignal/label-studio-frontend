import React, { Component } from "react";
import { Card, Button, Tooltip, Badge, List, Popconfirm } from "antd";
import { observer } from "mobx-react";
import {
  StarOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  StopOutlined,
  PlusOutlined,
  WindowsOutlined,
} from "@ant-design/icons";

import Utils from "../../utils";
import styles from "./Completion.module.scss";

import { guidGenerator } from "../../utils/unique";
import Controls from "../Controls/Controls";
import { RelationsOverlay } from "../RelationsOverlay/RelationsOverlay";
import Segment from "../Segment/Segment";
import Tree from "../../core/Tree";
import SideColumn from "../SideColumn/SideColumn";
import Panel from "../Panel/Panel";
import { Tabs } from "antd";
const { TabPane } = Tabs;

const Completion = observer(({ item, store }) => {
  const { settings } = store;
  const cs = store.completionStore;
  const root = cs.selected && cs.selected.root;
  const stMenu = settings.bottomSidePanel ? styles.menubsp : styles.menu;

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "100%", marginRight: "1em" }}>
        {store.hasInterface("panel") && <Panel store={store} />}
        {!cs.viewingAllCompletions && !cs.viewingAllPredictions && (
          <Segment completion={cs.selected} className={settings.bottomSidePanel ? "" : styles.segment + " ls-segment"}>
            <div style={{ position: "relative" }}>{Tree.renderItem(root)}</div>
          </Segment>
        )}
      </div>
      <div className={stMenu + " ls-menu"} style={{ minWidth: "300px", width: "300px" }}>
        {store.hasInterface("side-column") && !cs.viewingAllCompletions && !cs.viewingAllPredictions && (
          <SideColumn store={store} />
        )}
      </div>
    </div>
  );
});

export default Completion;

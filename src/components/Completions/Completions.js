import React, { Component } from "react";
import { Card, Button, Tooltip, Badge, List, Popconfirm, Tabs } from "antd";
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

import styles from "./Completions.module.scss";

import Utils from "../../utils";
import { guidGenerator } from "../../utils/unique";

import Controls from "../Controls/Controls";
import Segment from "../Segment/Segment";
import Completion from "../Completion/Completion";
import Tree from "../../core/Tree";
import SideColumn from "../SideColumn/SideColumn";
import Panel from "../Panel/Panel";
import { RelationsOverlay } from "../RelationsOverlay/RelationsOverlay";

const { TabPane } = Tabs;

export const DraftPanel = observer(({ item }) => {
  if (!item.draftSaved && !item.versions.draft) return null;
  const saved = item.draft && item.draftSaved ? ` saved ${Utils.UDate.prettyDate(item.draftSaved)}` : "";
  if (!item.selected) {
    if (!item.draft) return null;
    return <div>draft{saved}</div>;
  }
  if (!item.versions.result || !item.versions.result.length) {
    return <div>{saved ? `draft${saved}` : "not submitted draft"}</div>;
  }
  return (
    <div>
      <Tooltip placement="topLeft" title={item.draft ? "switch to submitted result" : "switch to current draft"}>
        <Button type="link" onClick={item.toggleDraft} className={styles.draftbtn}>
          {item.draft ? "draft" : "submitted"}
        </Button>
      </Tooltip>
      {saved}
    </div>
  );
});

const CompletionTabHeader = ({ item }) => {
  return <span>{item.id}</span>;
};

const PredictionTabHeader = ({ item }) => {
  return <span>P: {item.id}</span>;
};

class Completions extends Component {
  render() {
    const { store } = this.props;

    const cs = store.completionStore;
    const root = cs.selected && cs.selected.root;

    const extra = {
      right: (
        <Tooltip placement="topLeft" title="View all completions">
          <Button
            size="small"
            type={store.completionStore.viewingAllCompletions ? "primary" : ""}
            onClick={ev => {
              ev.preventDefault();
              store.completionStore.toggleViewingAllCompletions();
            }}
          >
            <WindowsOutlined />
          </Button>
        </Tooltip>
      ),
    };

    if (store.hasInterface("completions:add-new")) {
      extra["left"] = (
        <Tooltip placement="topLeft" title="Create a new completion">
          <Button
            size="small"
            onClick={ev => {
              ev.preventDefault();
              const c = store.completionStore.addCompletion({ userGenerate: true });
              store.completionStore.selectCompletion(c.id);
              // c.list.selectCompletion(c);
            }}
          >
            <PlusOutlined />
          </Button>
        </Tooltip>
      );
    }

    return (
      <div>
        <Tabs
          tabBarExtraContent={extra}
          activeKey={store.completionStore.selected.id}
          onTabClick={(cid, ev) => {
            cs.completions.find(c => c.id === cid || c.pk === String(cid))
              ? cs.selectCompletion(cid)
              : cs.selectPrediction(cid);
          }}
        >
          {store.completionStore.completions.map(c => {
            return (
              <TabPane tab={c.id} key={c.id} tab={<CompletionTabHeader item={c} />}>
                <Completion store={store} />
              </TabPane>
            );
          })}

          {store.completionStore.predictions.map(c => {
            return (
              <TabPane tab={c.id} key={c.id} tab={<PredictionTabHeader item={c} />}>
                <Completion store={store} />
              </TabPane>
            );
          })}
        </Tabs>
      </div>
    );
  }
}

export default observer(Completions);

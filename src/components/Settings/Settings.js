import React from "react";
import { Modal, Checkbox, Tabs, Table } from "antd";
import { observer } from "mobx-react";

import Hotkey from "../../core/Hotkey";

const HotkeysDescription = () => {
  const descr = Hotkey.keysDescipritions();
  const columns = [
    { title: "Key", dataIndex: "key", key: "key" },
    { title: "Description", dataIndex: "descr", key: "descr" },
  ];

  const data = Object.keys(descr)
    .filter(k => descr[k])
    .map(k => new Object({ key: k, descr: descr[k] })); // eslint-disable-line no-new-object

  return <Table columns={columns} dataSource={data} size="small" />;
};

export default observer(({ store }) => {
  return (
    <Modal
      visible={store.showingSettings}
      title="Settings"
      bodyStyle={{ paddingTop: "0" }}
      footer=""
      onCancel={store.toggleSettings}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="General" key="1">
          <Checkbox
            value="Enable labeling hotkeys"
            defaultChecked={store.settings.enableHotkeys}
            onChange={() => {
              store.settings.toggleHotkeys();
            }}
          >
            Enable labeling hotkeys
          </Checkbox>
          <br />
          <Checkbox
            value="Show tooltips"
            defaultChecked={store.settings.enableTooltips}
            onChange={() => {
              store.settings.toggleTooltips();
            }}
          >
            Show hotkey tooltips
          </Checkbox>
          <br />
          <Checkbox
            value="Show labels tooltips"
            defaultChecked={store.settings.enableLabelTooltips}
            onChange={() => {
              store.settings.toggleLabelTooltips();
            }}
          >
            Show labels hotkey tooltips
          </Checkbox>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Hotkeys" key="2">
          <HotkeysDescription />
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
});

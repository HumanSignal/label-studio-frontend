import React from "react";
import { Checkbox, Modal, Table, Tabs } from "antd";
import { observer } from "mobx-react";

import { Hotkey } from "../../core/Hotkey";

import "./Settings.styl";
import { Block, Elem } from "../../utils/bem";
import { triggerResizeEvent } from "../../utils/utilities";

import EditorSettings from "../../core/settings/editorsettings.json";
import { getEnv, getRoot } from "mobx-state-tree";

const HotkeysDescription = () => {
  const columns = [
    { title: "Shortcut", dataIndex: "combo", key: "combo" },
    { title: "Description", dataIndex: "descr", key: "descr" },
  ];

  const keyNamespaces = Hotkey.namespaces();

  const getData = (descr) => Object.keys(descr)
    .filter(k => descr[k])
    .map(k => ({
      key: k,
      combo: k.split(",").map(keyGroup => {
        return (
          <Elem name="key-group" key={keyGroup}>
            {keyGroup.trim().split("+").map((k) => <Elem tag="kbd" name="key" key={k}>{k}</Elem>)}
          </Elem>
        );
      }),
      descr: descr[k],
    }));

  return (
    <Block name="keys">
      <Tabs size="small">
        {Object.entries(keyNamespaces).map(([ns, data]) => {
          if (Object.keys(data.descriptions).length === 0) {
            return null;
          } else {
            return (
              <Tabs.TabPane key={ns} tab={data.description ?? ns}>
                <Table columns={columns} dataSource={getData(data.descriptions)} size="small" />
              </Tabs.TabPane>
            );
          }
        })}
      </Tabs>
    </Block>
  );
};



const TabPaneGeneral = (store) => {
  const env = getEnv(getRoot(store));

  return Object.keys(EditorSettings).map((obj, index)=> {
    return (
      <span key={index}>
        <Checkbox
          key={index}
          checked={store.settings[obj]}
          onChange={store.settings[EditorSettings[obj].onChangeEvent]}
        >
          {EditorSettings[obj].description}
        </Checkbox>
        <br />
      </span>
    );
  });
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
          {TabPaneGeneral(store)}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Hotkeys" key="2">
          <HotkeysDescription />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Layout" key="3">
          <Checkbox
            checked={store.settings.bottomSidePanel}
            onChange={() => {
              store.settings.toggleBottomSP();
              setTimeout(triggerResizeEvent);
            }}
          >
            Move sidepanel to the bottom
          </Checkbox>

          <br />
          <Checkbox checked={store.settings.displayLabelsByDefault} onChange={store.settings.toggleSidepanelModel}>
            Display Labels by default in Results panel
          </Checkbox>

          <br />
          <Checkbox
            value="Show Annotations panel"
            defaultChecked={store.settings.showAnnotationsPanel}
            onChange={() => {
              store.settings.toggleAnnotationsPanel();
            }}
          >
            Show Annotations panel
          </Checkbox>
          <br />
          <Checkbox
            value="Show Predictions panel"
            defaultChecked={store.settings.showPredictionsPanel}
            onChange={() => {
              store.settings.togglePredictionsPanel();
            }}
          >
            Show Predictions panel
          </Checkbox>

          {/* <br/> */}
          {/* <Checkbox */}
          {/*   value="Show image in fullsize" */}
          {/*   defaultChecked={store.settings.imageFullSize} */}
          {/*   onChange={() => { */}
          {/*     store.settings.toggleImageFS(); */}
          {/*   }} */}
          {/* > */}
          {/*   Show image in fullsize */}
          {/* </Checkbox> */}
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
});
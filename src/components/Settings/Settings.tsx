import { Checkbox, Table, Tabs } from 'antd';
import { createElement, FC } from 'react';

import { Hotkey, HotkeyNamespace } from '../../core/Hotkey';

import { Modal } from '@UI/Modal/ModalPopup';
import { Block, Elem } from '../../utils/bem';
import { triggerResizeEvent } from '../../utils/utilities';
import './Settings.styl';

import { useMemo } from 'react';
import { useAnnotationNames } from 'src/Engine/Atoms/Models/AnnotationsAtom/Hooks/useAnnotationNames';
import { useSettings, useSettingsVisibility } from 'src/Engine/Atoms/Models/SettingsAtom/Hooks';
import EditorSettings from '../../core/settings/editorsettings';
import * as TagSettings from './TagSettings';

const HotkeysDescription = () => {
  const columns = [
    { title: 'Shortcut', dataIndex: 'combo', key: 'combo' },
    { title: 'Description', dataIndex: 'descr', key: 'descr' },
  ];

  const keyNamespaces = Hotkey.namespaces();

  const getData = (descriptions: HotkeyNamespace['descriptions']) => {
    return Object.keys(descriptions)
      .filter(k => descriptions[k])
      .map(k => ({
        key: k,
        combo: k.split(',').map(keyGroup => {
          return (
            <Elem name="key-group" key={keyGroup}>
              {keyGroup.trim().split('+').map((k) => <Elem tag="kbd" name="key" key={k}>{k}</Elem>)}
            </Elem>
          );
        }),
        descr: descriptions[k],
      }));
  };

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

const GeneralSettings: FC = () => {
  type SettingsNames = keyof typeof EditorSettings;
  const settingsNames = Object.keys(EditorSettings) as SettingsNames[];
  const [settings, updateSettings] = useSettings();

  return (
    <Block name="settings">
      {settingsNames.map((obj, index) => {
        return (
          <Elem name="field" key={index}>
            <Checkbox
              key={index}
              checked={settings[obj]}
              onChange={(e) => {
                updateSettings({
                  [obj]: e.target.checked,
                });
              }}
            >
              {EditorSettings[obj].description}
            </Checkbox>
            <br />
          </Elem>
        );
      })}
    </Block>
  );
};

const LayoutSettings = () => {
  const [settings, updateSettings] = useSettings();

  return (
    <Block name="settings">
      <Elem name="field">
        <Checkbox
          checked={settings.bottomSidePanel}
          onChange={() => {
            updateSettings({
              bottomSidePanel: !settings.bottomSidePanel,
            });
            setTimeout(triggerResizeEvent);
          }}
        >
              Move sidepanel to the bottom
        </Checkbox>
      </Elem>

      <Elem name="field">
        <Checkbox
          value="Show Annotations panel"
          defaultChecked={settings.showAnnotationsPanel}
          onChange={() => {
            updateSettings({
              showAnnotationsPanel: !settings.showAnnotationsPanel,
            });
          }}
        >
            Show Annotations panel
        </Checkbox>
      </Elem>

      <Elem name="field">
        <Checkbox
          value="Show Predictions panel"
          defaultChecked={settings.showPredictionsPanel}
          onChange={() => {
            updateSettings({
              showPredictionsPanel: !settings.showPredictionsPanel,
            });
          }}
        >
              Show Predictions panel
        </Checkbox>
      </Elem>

      {/* Saved for future use */}
      {/* <Elem name="field">
        <Checkbox
          value="Show image in fullsize"
          defaultChecked={store.settings.imageFullSize}
          onChange={() => {
            store.settings.toggleImageFS();
          }}
        >
          Show image in fullsize
        </Checkbox>

      </Elem> */}
    </Block>
  );
};

const Settings = {
  General: { name: 'General', component: GeneralSettings },
  Hotkeys: { name: 'Hotkeys', component: HotkeysDescription },
  Layout: { name: 'Layout', component: LayoutSettings },
};

const DEFAULT_ACTIVE = Object.keys(Settings)[0];

export const SettingsView: FC = () => {
  const names = useAnnotationNames();
  const [settingsVisible, _, setSettingsVisibility] = useSettingsVisibility();

  const availableSettings = useMemo(() => {
    const availableTags = Object.values(names);
    const settingsScreens = Object.values(TagSettings);

    return availableTags.reduce((res, tagName) => {
      const tagType = names.get(tagName).type;
      const settings = settingsScreens.find(({ tagName }) => {
        return tagName.toLowerCase() === tagType.toLowerCase();
      });

      if (settings) res.push(settings);

      return res;
    }, []);
  }, []);

  return settingsVisible ? (
    <Modal
      visible
      title="Settings"
      onHide={() => setSettingsVisibility(false)}
      body={() => (
        <Block name="settings">
          <Tabs defaultActiveKey={DEFAULT_ACTIVE}>
            {Object.entries(Settings).map(([key, { name, component }]) => (
              <Tabs.TabPane tab={name} key={key}>
                {createElement(component)}
              </Tabs.TabPane>
            ))}
            {/* TODO: implement Page */}
            {availableSettings.map((Page: any) => (
              <Tabs.TabPane tab={Page.title} key={Page.tagName}>
                <Page/>
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Block>
      )}
    />
  ) : null;
};

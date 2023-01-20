import { useAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { useCallback } from 'react';
import { SettingsAtom } from './SettingsAtom';
import { Settings } from './Types';

const settingsParamsAtom = focusAtom(SettingsAtom, (optic) => optic.prop('settings'));

const settingsVisibilityAtom = focusAtom(SettingsAtom, (optic) => optic.prop('visible'));

type UseSettingsResult = [Settings, (patch: Partial<Settings>) => void, () => void]

export const useSettings = (): UseSettingsResult => {
  const [_, toggleVisibility] = useSettingsVisibility();
  const [settings, updateSettings] = useAtom(settingsParamsAtom);

  const setSettings = useCallback((settings: Partial<Settings>) => {
    updateSettings((currentSettings) => ({ ...currentSettings, ...settings }));
  }, [settings]);

  return [settings, setSettings, toggleVisibility];
};

export const useSettingsVisibility = (): [
  visible: boolean,
  toggleVisibility: () => void,
  setVisibility: (visible: boolean) => void,
] => {
  const [visible, setVisible] = useAtom(settingsVisibilityAtom);

  const toggleVisibility = useCallback(() => {
    setVisible(current => !current);
  }, [visible]);

  return [visible, toggleVisibility, setVisible];
};

import { useAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { useCallback } from 'react';
import { SettingsAtom } from './SettingsAtom';
import { Settings } from './Types';

const SettingsParamsAtom = focusAtom(SettingsAtom, (optic) => optic.prop('settings'));

export const useSettings = (): [Settings, (patch: Partial<Settings>) => void] => {
  const [settings, updateSettings] = useAtom(SettingsParamsAtom);

  const setSettings = useCallback((settings: Partial<Settings>) => {
    updateSettings((currentSettings) => ({ ...currentSettings, ...settings }));
  }, [settings]);

  return [settings, setSettings];
};

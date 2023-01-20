import { SettingsStore } from './Types';
import { InitialState } from './InitialState';
import { focusAtom } from 'jotai-optics';
import { atomWithReset } from 'jotai/utils';

export const SettingsAtom = atomWithReset<SettingsStore>(InitialState);

export const SettingsVisibilityAtom = focusAtom(SettingsAtom, (optic) => optic.prop('visible'));

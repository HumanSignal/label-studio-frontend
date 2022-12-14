import { atomWithReset } from 'jotai/utils';
import { focusAtom } from 'jotai-optics';
import { InitialState } from './InitialState';
import { RootStore } from './Types';
import { atom } from 'jotai';

export const RootAtom = atomWithReset<RootStore>(InitialState);

export const InstructionsAtom = atom((get) => {
  const showInstructions = focusAtom(RootAtom, (optic) => optic.prop('showingDescription'));
  const instructions = get(showInstructions)
    ? get(focusAtom(RootAtom, (optic) => optic.prop('description')))
    : '';

  return instructions;
});

export const InterfacesAtom = focusAtom(RootAtom, (optic) => optic.prop('interfaces'));

export const TaskAtom = focusAtom(RootAtom, (optic) => optic.prop('task'));

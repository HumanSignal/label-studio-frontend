import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithReset } from 'jotai/utils';
import { InitialState } from './InitialState';
import { RootStore } from './Types';

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

export const TaskHistoryAtom = focusAtom(RootAtom, (optic) => optic.prop('taskHistory'));

export const InstructionsVisibilityAtom = focusAtom(RootAtom, (optic) => optic.prop('showingDescription'));

export const TaskHistoryControlAtom = atom((get) => {
  const task = get(TaskAtom);
  const taskHistory = get(TaskHistoryAtom);

  const hasHistory = task && taskHistory && taskHistory.length > 1;
  const canGoNext = () => {
    if (hasHistory) {
      const lastTaskId = taskHistory[taskHistory.length - 1].taskId;

      return task.id !== lastTaskId;
    }
    return false;
  };

  const canGoPrev = () => {
    if (hasHistory) {
      const firstTaskId = taskHistory[0].taskId;

      return task.id !== firstTaskId;
    }

    return false;
  };

  return {
    history: taskHistory,
    canGoNext,
    canGoPrev,
  };
});

export const autoAnnotationAtom = focusAtom(RootAtom, (optic) => optic.prop('autoAnnotation'));

export const autoAcceptSuggestionsAtom = focusAtom(RootAtom, (optic) => optic.prop('autoAcceptSuggestions'));

export const forceAutoAnnotationAtom = focusAtom(RootAtom, (optic) => optic.prop('forceAutoAnnotation'));

export const forceAutoAcceptSuggestionsAtom = focusAtom(RootAtom, (optic) => optic.prop('forceAutoAcceptSuggestions'));

export const taskAtom = focusAtom(RootAtom, (optic) => optic.prop('task'));

import { atom } from 'jotai';
import { createContext, useContext } from 'react';
import { LabelController } from '../Label/LabelController';

const initialValue = atom<LabelController[]>([]);

type LabelsContextValue = {
  selected: typeof initialValue,
}

export const LabelsContext = createContext<LabelsContextValue>({
  selected: initialValue,
});

export const LabelsContextProvider = LabelsContext.Provider;

export const useLabelsContext = () => {
  return useContext(LabelsContext);
};

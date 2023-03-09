import { createContext } from 'react';

interface SidePanelsContextProps {
  locked: boolean;
  updatePanelTabs?: any;
}

export const SidePanelsContext = createContext<SidePanelsContextProps>({
  locked: false,
  updatePanelTabs: undefined,
});

import { createContext } from 'react';

interface SideTabPanelsContextProps {
  locked: boolean;
}

export const SidePanelsContext = createContext<SideTabPanelsContextProps>({
  locked: false,
});

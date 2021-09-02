import { createContext } from "react";

export const SmartToolsContext = createContext({ tools: [] });

export const SmartToolsProvider = SmartToolsContext.Provider;

export const ToolbarContext = createContext({ expanded: false });

export const ToolbarProvider = ToolbarContext.Provider;

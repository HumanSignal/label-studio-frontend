import { createContext } from "react";

export const FramesContext = createContext({
  // Enables keyframes controls
  enableKeyframes: true,
});

export const FramesProvider = FramesContext.Provider;

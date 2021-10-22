import { createContext } from "react";
import { TimelineContext } from "../../Types";

export const FramesContext = createContext<TimelineContext>({
  // Enables keyframes controls
  enableKeyframes: true,
});

export const FramesProvider = FramesContext.Provider;

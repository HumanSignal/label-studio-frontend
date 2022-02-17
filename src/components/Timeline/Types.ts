import { FC, MouseEvent } from "react";
import { ViewTypes } from "./Views";

export interface TimelineProps<D extends ViewTypes = "frames"> {
  regions: any[];
  length: number;
  position: number;
  mode: D;
  framerate: number;
  playing: boolean;
  zoom?: number;
  fullscreen?: boolean;
  disableView?: boolean;
  className?: string;
  defaultStepSize?: number;
  allowFullscreen?: boolean;
  allowViewCollapse?: boolean;
  displaySeeker?: boolean;
  hopSize?: number;
  data?: any;
  onReady?: (data: Record<string, any>) => void;
  onPlayToggle: (playing: boolean) => void;
  onPositionChange: (value: number) => void;
  onToggleVisibility?: (id: string, visibility: boolean) => void;
  onDeleteRegion?: (id: string) => void;
  onSelectRegion?: (event: MouseEvent<HTMLDivElement>, id: string, select?: boolean) => void;
  onAction?: (event: MouseEvent, action: string, data?: any) => void;
  onFullscreenToggle?: () => void;
}

export interface TimelineViewProps {
  step: number;
  offset: number;
  position: number;
  length: number;
  playing: boolean;
  regions: TimelineRegion[];
  onReady?: TimelineProps["onReady"];
  onScroll: (position: number) => void;
  onChange: (position: number) => void;
  onResize: (position: number) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  onDeleteRegion?: (id: string) => void;
  onSelectRegion?: (e: MouseEvent<HTMLDivElement>, id: string, select?: boolean) => void;
}

export interface TimelineRegion {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  selected: boolean;
  sequence: TimelineRegionKeyframe[];
}

export interface TimelineRegionKeyframe {
  frame: number;
  enabled: boolean;
}

export interface TimelineContextValue {
  position: number;
  length: number;
  regions: TimelineRegion[];
  step: number;
  playing: boolean;
  settings?: TimelineSettings;
  data?: any;
}

export interface TimelineMinimapProps {
  regions: TimelineRegion[];
  step: number;
  length: number;
}

export type TimelineSettings = {
  stepBackHotkey?: string,
  stepForwardHotkey?: string,
  playpauseHotkey?: string,
  stepAltBack?: string,
  stepAltForward?: string,
  fastTravelSize?: TimelineStepFunction,
  stepSize?: TimelineStepFunction,
}

export type TimelineStepFunction = (length: number, position: number, regions: TimelineRegion[], direction: -1 | 1) => number;

export interface TimelineExtraControls<A extends string, D extends any> {
  onAction?: <T extends Element>(e: MouseEvent<T>, action: A, data?: D) => void;
}

export type TimelineView<D extends FC<TimelineExtraControls<any, any>> = any> = {
  View: FC<TimelineViewProps>,
  Minimap?: FC<any>,
  Controls?: D,
  settings?: TimelineSettings,
}
